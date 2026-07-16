'use client'
import { useEffect, useRef } from "react";

// Renders the flying product thumbnail on top of everything else, animating
// it from wherever "Add to cart" was tapped to the cart icon in the nav.
// Purely a visual flourish — the actual cart mutation already happened by
// the time this runs (see addToCart in AppContext).
// Takes its state as props (rather than useAppContext) because it is mounted
// directly inside AppContext's own provider — consuming the hook here would
// create a circular import between the context module and this component.
const CartFlyAnimation = ({ flyToCartRequest, clearFlyToCartRequest, cartIconRef, bumpCartIcon }) => {
  const nodeRef = useRef(null);

  useEffect(() => {
    if (!flyToCartRequest || typeof window === 'undefined') return undefined;

    const node = nodeRef.current;
    const targetEl = cartIconRef.current;
    if (!node || !targetEl) {
      clearFlyToCartRequest();
      return undefined;
    }

    const { sourceRect } = flyToCartRequest;
    const targetRect = targetEl.getBoundingClientRect();
    const startCenterX = sourceRect.left + sourceRect.width / 2;
    const startCenterY = sourceRect.top + sourceRect.height / 2;
    const endCenterX = targetRect.left + targetRect.width / 2;
    const endCenterY = targetRect.top + targetRect.height / 2;
    const dx = endCenterX - startCenterX;
    const dy = endCenterY - startCenterY;
    const arcLift = Math.min(-60, dy * 0.6 - 40);

    const animation = node.animate([
      { transform: 'translate(0px, 0px) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 + arcLift}px) scale(0.65)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.35, offset: 1 },
    ], { duration: 650, easing: 'cubic-bezier(0.3, 0.7, 0.35, 1)', fill: 'forwards' });

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      bumpCartIcon();
      clearFlyToCartRequest();
    };

    animation.addEventListener('finish', finish);
    animation.addEventListener('cancel', finish);
    return () => {
      animation.removeEventListener('finish', finish);
      animation.removeEventListener('cancel', finish);
    };
    // sourceRect/targetEl are read once per request id; re-running per id is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToCartRequest?.id]);

  if (!flyToCartRequest) return null;

  const { sourceRect, imageUrl } = flyToCartRequest;

  return (
    <div
      ref={nodeRef}
      aria-hidden="true"
      className="pointer-events-none fixed z-[70] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5"
      style={{
        top: sourceRect.top,
        left: sourceRect.left,
        width: sourceRect.width,
        height: sourceRect.height,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" className="h-full w-full object-contain p-1.5" />
    </div>
  );
};

export default CartFlyAnimation;
