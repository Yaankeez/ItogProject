const booksContainer = document.getElementById('booksContainer');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const carouselTrack = document.querySelector('.carousel-track');

let books = [];
let currentPosition = 0;
let autoScrollInterval;

// Инициализация карусели
function initCarousel() {
  carouselTrack.innerHTML = '';
  
  books.forEach(book => {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    item.innerHTML = `
      <div class="book-card">
        <img src="assets/${book.cover}" alt="${book.title}" />
        <div class="card-body">
          <h3>${book.title}</h3>
          <p>${book.author}</p>
        </div>
      </div>
    `;
    item.addEventListener('click', () => openModal(book));
    carouselTrack.appendChild(item);
  });

  startAutoScroll();
}

function moveCarousel(direction) {
  const itemWidth = document.querySelector('.carousel-item').offsetWidth + 16;
  const visibleItems = Math.floor(carouselTrack.offsetWidth / itemWidth);
  const maxPosition = carouselTrack.scrollWidth - carouselTrack.offsetWidth;

  currentPosition = direction === 'next' 
    ? Math.min(currentPosition + (itemWidth * visibleItems), maxPosition)
    : Math.max(currentPosition - (itemWidth * visibleItems), 0);

  carouselTrack.style.transform = `translateX(-${currentPosition}px)`;
}

function startAutoScroll() {
  autoScrollInterval = setInterval(() => {
    const itemWidth = document.querySelector('.carousel-item').offsetWidth + 16;
    const maxPosition = carouselTrack.scrollWidth - carouselTrack.offsetWidth;
    
    if (currentPosition >= maxPosition) {
      currentPosition = 0;
    } else {
      currentPosition += itemWidth * 2;
    }
    
    carouselTrack.style.transform = `translateX(-${currentPosition}px)`;
  }, 5000);
}

// Обработчики событий
document.querySelector('.carousel-btn.prev').addEventListener('click', () => {
  clearInterval(autoScrollInterval);
  moveCarousel('prev');
  startAutoScroll();
});

document.querySelector('.carousel-btn.next').addEventListener('click', () => {
  clearInterval(autoScrollInterval);
  moveCarousel('next');
  startAutoScroll();
});

carouselTrack.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
carouselTrack.addEventListener('mouseleave', startAutoScroll);

// Загрузка данных
fetch('books.json')
  .then(res => {
    if (!res.ok) throw new Error('Ошибка загрузки данных');
    return res.json();
  })
  .then(data => {
    books = data;
    renderBooks(books);
    initCarousel();
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