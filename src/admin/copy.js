/** Wording that differs between the Events and Menu areas. */
export const COPY = {
  event: {
    title: 'Events',
    subtitle: 'Your celebration categories, like Walima or Mehndi. Tap one to manage its setups.',
    path: '/admin/events',
    publicPath: '/events/',
    item: 'setup',
    items: 'setups',
    addItem: 'Add setup',
    folder: 'events',
  },
  menu: {
    title: 'Menu',
    subtitle: 'Your menu categories, like Main course or BBQ. Tap one to manage its dishes.',
    path: '/admin/menu',
    publicPath: '/menu/',
    item: 'dish',
    items: 'dishes',
    addItem: 'Add dish',
    folder: 'menu',
  },
}

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
