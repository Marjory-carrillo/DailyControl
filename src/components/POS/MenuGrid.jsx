import React, { useState, useCallback } from 'react';

export default function MenuGrid({ selectedCategory, items, onAddToCart, searchTerm = '' }) {
  const [flyingItem, setFlyingItem] = useState(null);

  const filteredItems = items.filter(item => {
    if (searchTerm.trim() !== '') {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return item.category === selectedCategory;
  });

  const handleAdd = useCallback((item, e) => {
    // Trigger animation
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyingItem({ id: Date.now(), name: item.name, image: item.image, x: rect.left + rect.width / 2, y: rect.top });
    setTimeout(() => setFlyingItem(null), 500);
    onAddToCart(item);
  }, [onAddToCart]);

  return (
    <>
      {/* Product grid — compact cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
        gap: '8px',
        padding: '8px',
      }}>
        {filteredItems.length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-light)', padding: '20px' }}>No se encontraron productos.</p>
        )}
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={(e) => handleAdd(item, e)}
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '12px',
              padding: '10px 6px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{item.image}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#333', textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {item.name}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--primary-color)' }}>
              ${item.price.toFixed(2)}
            </span>
          </button>
        ))}
      </div>

      {/* Flying animation when adding to cart */}
      {flyingItem && (
        <div
          key={flyingItem.id}
          style={{
            position: 'fixed',
            left: flyingItem.x - 20,
            top: flyingItem.y - 10,
            zIndex: 9999,
            pointerEvents: 'none',
            animation: 'flyToCart 0.45s ease-in forwards',
          }}
        >
          <div style={{
            background: 'var(--primary-color)',
            color: 'white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            boxShadow: '0 4px 15px rgba(255,107,107,0.5)',
          }}>
            {flyingItem.image}
          </div>
        </div>
      )}

      <style>{`
        @keyframes flyToCart {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.6) translateY(-40px);
          }
          100% {
            opacity: 0;
            transform: scale(0.3) translateY(-80px) translateX(50px);
          }
        }
      `}</style>
    </>
  );
}
