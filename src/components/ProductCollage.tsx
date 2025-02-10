import React from 'react';

const products = [
  {
    id: 1,
    name: 'Handwoven Jamaican Basket',
    image: '/images/products/jamaican-basket.jpg',
    description: 'Colorful handwoven basket with traditional patterns',
    position: 'col-span-2 row-span-2'
  },
  {
    id: 2,
    name: 'Seashell Necklace',
    image: '/images/products/shell-necklace.jpg',
    description: 'Handcrafted seashell necklace with coral and turquoise accents',
    position: 'col-span-1 row-span-1'
  },
  {
    id: 3,
    name: 'Jamaican Art Print',
    image: '/images/products/jamaica-art.jpg',
    description: 'Beautiful wood carving depicting island life',
    position: 'col-span-1 row-span-1'
  },
  {
    id: 4,
    name: 'Beach Hat Collection',
    image: '/images/products/beach-hat.jpg',
    description: 'Handcrafted straw hat with plumeria flowers',
    position: 'col-span-1 row-span-2'
  },
  {
    id: 5,
    name: 'Island Souvenirs',
    image: '/images/products/souviner.jpg',
    description: 'Authentic Jamaican souvenirs and collectibles',
    position: 'col-span-1 row-span-1'
  },
  {
    id: 6,
    name: 'Tropical Sandals',
    image: '/images/products/flower-sandals.jpg',
    description: 'Handmade floral sandals perfect for beach walks',
    position: 'col-span-1 row-span-1'
  }
];

export default function ProductCollage() {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl bg-white">
      <div className="grid grid-cols-3 grid-rows-2 gap-2 p-2 aspect-[3/2]">
        {/* First Column */}
        <div className="space-y-2">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={products[1].image}
              alt={products[1].name}
              className="w-full h-full object-cover"
            />
            <HoverOverlay product={products[1]} />
          </div>
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={products[5].image}
              alt={products[5].name}
              className="w-full h-full object-cover"
            />
            <HoverOverlay product={products[5]} />
          </div>
        </div>

        {/* Center Column - Large Feature Image */}
        <div className="relative rounded-lg overflow-hidden row-span-2">
          <img
            src={products[0].image}
            alt={products[0].name}
            className="w-full h-full object-cover"
          />
          <HoverOverlay product={products[0]} />
        </div>

        {/* Third Column */}
        <div className="space-y-2">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={products[2].image}
              alt={products[2].name}
              className="w-full h-full object-cover"
            />
            <HoverOverlay product={products[2]} />
          </div>
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={products[4].image}
              alt={products[4].name}
              className="w-full h-full object-cover"
            />
            <HoverOverlay product={products[4]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate component for the hover overlay to reduce code duplication
const HoverOverlay = ({ product }: { product: typeof products[0] }) => (
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
    <div className="absolute bottom-4 left-4 right-4 text-white">
      <p className="text-lg font-semibold mb-1">{product.name}</p>
      <p className="text-sm opacity-90">{product.description}</p>
    </div>
  </div>
);
