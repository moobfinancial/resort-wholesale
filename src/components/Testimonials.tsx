import React from 'react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Resort Gift Shop Manager',
    content: 'The quality and authenticity of the products have made our gift shop a favorite among guests. Excellent wholesale pricing and reliable delivery.',
    image: '/images/testimonials/sarah.jpg'
  },
  {
    name: 'Michael Brown',
    role: 'Retail Store Owner',
    content: 'Working with this supplier has transformed our business. The variety of products and their commitment to quality is outstanding.',
    image: '/images/testimonials/michael.jpg'
  },
  {
    name: 'Lisa Thompson',
    role: 'Tourism Director',
    content: 'Their merchandise perfectly represents Jamaican culture and craftsmanship. A trusted partner for authentic tourist products.',
    image: '/images/testimonials/lisa.jpg'
  }
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          What Our Partners Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-xl shadow-lg p-8 transform hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex items-center mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.content}"</p>
              <div className="mt-6 flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
