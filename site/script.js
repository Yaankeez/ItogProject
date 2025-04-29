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
    <div class="book-info">
      <p><strong>Автор:</strong> ${book.author}</p>
      <p><strong>Год издания:</strong> ${book.year}</p>
    </div>
    <p class="book-description">${book.description}</p>
    
    <div class="reviews-section">
      <h3>Отзывы ${existingReviews.length ? `(${existingReviews.length})` : ''}</h3>
      ${existingReviews.length ? 
        '<ul class="review-list" id="reviewList"></ul>' : 
        '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>'}
    </div>

    <form id="reviewForm">
      <div class="form-row">
        <input type="text" name="name" placeholder="Ваше имя" required />
        <input type="email" name="email" placeholder="Ваш email" required />
      </div>
      <textarea 
        name="comment" 
        rows="4" 
        placeholder="Ваш отзыв..." 
        required
      ></textarea>
      <button type="submit">Опубликовать отзыв</button>
    </form>
  `;

  if(existingReviews.length) {
    const reviewList = document.getElementById('reviewList');
    
    function renderReviews() {
      reviewList.innerHTML = '';
      existingReviews.forEach(r => {
        const li = document.createElement('li');
        li.className = 'review-item';
        const date = new Date(r.date).toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        li.innerHTML = `
          <header>
            <span>${r.name}</span>
            <span>${date}</span>
          </header>
          <p>${r.comment}</p>
        `;
        reviewList.append(li);
      });
    }
    
    renderReviews();
  }

  const reviewForm = document.getElementById('reviewForm');
  if(reviewForm) {
    reviewForm.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(reviewForm);
      const review = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        comment: formData.get('comment').trim(),
        date: new Date().toISOString()
      };
      
      if(!review.name || !review.email || !review.comment) return;
      
      existingReviews.push(review);
      localStorage.setItem(reviewsKey, JSON.stringify(existingReviews));
      openModal(book); // Перезагружаем модальное окно
    });
  }

  modal.style.display = 'flex';
}

modalClose.addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});