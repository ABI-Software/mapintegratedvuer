import mitt from 'mitt';
const EventBus = new mitt();

// Subscribe a map of { eventName: handler } and return a function that
// unsubscribes them all.
export const onEvents = (handlers) => {
  Object.entries(handlers).forEach(([name, fn]) => EventBus.on(name, fn));
  return () => Object.entries(handlers).forEach(([name, fn]) => EventBus.off(name, fn));
};

export default EventBus;
