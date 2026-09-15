'use client';
import React from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { defaultAvatar } from '@/lib/config';

interface Review {
  id: number;
  nombre: string;
  calificacion: number;
  comentario: string | null;
  fecha_respuesta: string;
}

const ReviewsCarousel: React.FC = () => {
  const [reviews, setReviews] = React.useState<Review[]>([]);

  React.useEffect(() => {
    fetch('/api/encuestas/destacadas')
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, []);

  const formatDate = (date: string) => new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(date));

  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Opiniones de clientes que calificaron su experiencia con 5 estrellas.
          </p>
        </div>

        {reviews.length > 0 ? <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          breakpoints={{
            640: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 2,
            },
            1280: {
              slidesPerView: 3,
            },
          }}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
          }}
          className="pb-12"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review.id}>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                        <Image
                          src={defaultAvatar}
                          alt={`Avatar de ${review.nombre}`}
                          width={56}
                          height={56}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {review.nombre}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Cliente verificado
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full">
                      <span className="material-symbols-outlined text-yellow-400">star</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {review.calificacion}.0
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 leading-7 mb-6">
                    &quot;{review.comentario || 'Sin comentario adicional.'}&quot;
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatDate(review.fecha_respuesta)}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Encuesta de satisfacción
                  </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper> : (
          <p className="text-center text-gray-500 dark:text-gray-400">Aún no hay reseñas para mostrar.</p>
        )}
      </div>
    </section>
  );
};

export default ReviewsCarousel;
