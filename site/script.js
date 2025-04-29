const booksContainer = document.getElementById('booksContainer');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const sliderWrapper = document.querySelector('.slider__wrapper');
const slider = document.querySelector('.slider');
let books = [];
let sliderIndex = 0;
let sliderInterval;

// Инициализация стрелок
const prevArrow = createArrow('prev');
const nextArrow = createArrow('next');
slider.append(prevArrow, nextArrow);

function createArrow(direction) {
  const arrow = document.createElement('button');
  arrow.className = `slider-arrow slider-arrow--${direction}`;
  arrow.innerHTML = `
    <svg viewBox="0 0 24 24">
      ${direction === 'prev' ? 
        '<path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>' : 
        '<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>'}
    </svg>
  `;
  arrow.addEventListener('click', () => handleArrowClick(direction));
  return arrow;
}

function handleArrowClick(direction) {
  clearInterval(sliderInterval);
  if (direction === 'prev') {
    sliderIndex = sliderIndex > 0 ? sliderIndex - 1 : sliderWrapper.children.length - 1;
  } else {
    sliderIndex = (sliderIndex + 1) % sliderWrapper.children.length;
  }
  updateSlider();
  startSlider();
}

function initSlider() {
  const featuredBooks = books.slice(0, 5);
  sliderWrapper.innerHTML = '';
  
  featuredBooks.forEach(book => {
    const slide = document.createElement('div');
    slide.className = 'slider__slide';
    slide.innerHTML = `
      <img src="assets/${book.cover}" alt="${book.title}" />
      <div class="slide-caption">
        <h3>${book.title}</h3>
        <p>${book.author} · ${book.year}</p>
      </div>
    `;
    slide.addEventListener('click', () => openModal(book));
    sliderWrapper.appendChild(slide);
  });

  startSlider();
}

function startSlider() {
  clearInterval(sliderInterval);
  sliderInterval = setInterval(() => {
    sliderIndex = (sliderIndex + 1) % sliderWrapper.children.length;
    updateSlider();
  }, 5000);
}

function updateSlider() {
  sliderWrapper.style.transform = `translateX(-${sliderIndex * 100}%)`;
}

sliderWrapper.addEventListener('mouseover', () => clearInterval(sliderInterval));
sliderWrapper.addEventListener('mouseout', startSlider);

// Загрузка данных
fetch('books.json')
  .then(res => {
    if (!res.ok) throw new Error('Ошибка загрузки данных');
    return res.json();
  })
  .then(data => {
    books = data;
    renderBooks(books);
    initSlider();
  })
  .catch(err => {
    booksContainer.innerHTML = '<p>Не удалось загрузить данные.</p>';
    console.error(err);
  });

function renderBooks(list) {
  booksContainer.innerHTML = '';
  list.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <img src="assets/${book.cover}" alt="${book.title}" />
      <div class="card-body">
        <h3>${book.title}</h3>
        <p>${book.author}</p>
      </div>
    `;
    card.addEventListener('click', () => openModal(book));
    booksContainer.append(card);
  });
}

searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  const filtered = books.filter(b => 
    b.title.toLowerCase().includes(term) ||
    b.author.toLowerCase().includes(term)
  );
  renderBooks(filtered);
});

sortSelect.addEventListener('change', () => {
  const key = sortSelect.value;
  if (!key) return renderBooks(books);
  const sorted = [...books].sort((a, b) => a[key] > b[key] ? 1 : -1);
  renderBooks(sorted);
});

function openModal(book) {
  const reviewsKey = `reviews_${book.id}`;
  const existingReviews = JSON.parse(localStorage.getItem(reviewsKey)) || [];

  modalBody.innerHTML = `
    <img class="modal__image" src="assets/${book.cover}" alt="${book.title}" />
    <h2>${book.title}</h2>
    <p><strong>Автор:</strong> ${book.author}</p>
    <p><strong>Год:</strong> ${book.year}</p>
    <p>${book.description}</p>
    <h3>Отзывы</h3>
    <ul class="review-list" id="reviewList"></ul>
    <form id="reviewForm">
      <input type="text" name="name" placeholder="Имя" required />
      <input type="email" name="email" placeholder="Email" required />
      <textarea name="comment" rows="3" placeholder="Комментарий" required></textarea>
      <button type="submit">Отправить</button>
    </form>
  `;

  const reviewList = document.getElementById('reviewList');
  const reviewForm = document.getElementById('reviewForm');

  function renderReviews() {
    reviewList.innerHTML = '';
    existingReviews.forEach(r => {
      const li = document.createElement('li');
      li.className = 'review-item';
      const date = new Date(r.date).toLocaleString('ru-RU');
      li.innerHTML = `
        <header>${r.name}<span>${date}</span></header>
        <p>${r.comment}</p>
      `;
      reviewList.append(li);
    });
  }

  renderReviews();

  reviewForm.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(reviewForm);
    const review = {
      name: formData.get('name'),
      email: formData.get('email'),
      comment: formData.get('comment'),
      date: new Date().toISOString()
    };
    existingReviews.push(review);
    localStorage.setItem(reviewsKey, JSON.stringify(existingReviews));
    renderReviews();
    reviewForm.reset();
  });

  modal.style.display = 'flex';
}

modalClose.addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});