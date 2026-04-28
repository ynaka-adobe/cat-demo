/**
 * Invoke callback once when the element enters the viewport.
 * @param {Element} element
 * @param {(el: Element) => void} callback
 */
export default function observe(element, callback) {
  if (!element || typeof callback !== 'function') return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target);
          obs.disconnect();
        }
      });
    },
    { rootMargin: '200px 0px' },
  );

  observer.observe(element);
}
