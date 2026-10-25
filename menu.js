/* MasterChefHub: delivery menu. EDIT THIS FILE to change dishes and prices.
 * price is in dollars. cat must be one of the ids in CATS below.
 * After you edit it on GitHub, the site updates by itself. */
export const CURRENCY = 'USD';
export const FEE = 3.00;          /* flat delivery fee in dollars (use 0 for free delivery) */
export const MIN_ORDER = 8.00;    /* smallest food total allowed, in dollars (0 for no minimum) */

export const CATS = [
  ['all', 'All'],
  ['sandwiches', 'Sandwiches'],
  ['pasta', 'Pasta'],
  ['breakfast', 'Breakfast'],
  ['sides', 'Sides'],
  ['sweets', 'Cakes and sweets'],
  ['drinks', 'Drinks']
];

export const MENU = [
  { id: 'grilled-cheese', cat: 'sandwiches', name: 'Grilled cheese', price: 5.50, desc: 'Toasted bread with melted cheese.' },
  { id: 'turkey-sandwich', cat: 'sandwiches', name: 'Turkey sandwich', price: 7.00, desc: 'Turkey, lettuce, tomato and mayo on soft bread.' },
  { id: 'blt', cat: 'sandwiches', name: 'BLT sandwich', price: 7.50, desc: 'Crispy bacon, lettuce and tomato on toast.' },
  { id: 'ham-cheese', cat: 'sandwiches', name: 'Ham and cheese', price: 6.50, desc: 'Sliced ham and cheese, served cold or toasted.' },
  { id: 'pbj', cat: 'sandwiches', name: 'Peanut butter and jelly', price: 4.00, desc: 'A classic. Tell us in the notes if there is a nut allergy.' },

  { id: 'spaghetti-meat', cat: 'pasta', name: 'Spaghetti with meat sauce', price: 9.50, desc: 'Spaghetti with a simple tomato and beef sauce.' },
  { id: 'mac-cheese', cat: 'pasta', name: 'Mac and cheese', price: 8.00, desc: 'Creamy baked macaroni and cheese.' },
  { id: 'butter-noodles', cat: 'pasta', name: 'Buttered noodles', price: 6.00, desc: 'Noodles with butter, a little garlic and parmesan.' },
  { id: 'alfredo', cat: 'pasta', name: 'Chicken alfredo', price: 11.00, desc: 'Fettuccine with chicken in a creamy sauce.' },

  { id: 'eggs-toast', cat: 'breakfast', name: 'Scrambled eggs and toast', price: 6.00, desc: 'Three scrambled eggs with buttered toast.' },
  { id: 'pancakes', cat: 'breakfast', name: 'Pancakes', price: 7.00, desc: 'A stack of fluffy pancakes with syrup.' },
  { id: 'breakfast-sandwich', cat: 'breakfast', name: 'Egg and cheese sandwich', price: 5.50, desc: 'Fried egg and cheese on a toasted bun.' },

  { id: 'fries', cat: 'sides', name: 'French fries', price: 3.50, desc: 'Hot, crispy and lightly salted.' },
  { id: 'salad', cat: 'sides', name: 'Side salad', price: 4.00, desc: 'Lettuce, tomato and cucumber with dressing.' },
  { id: 'garlic-bread', cat: 'sides', name: 'Garlic bread', price: 3.50, desc: 'Toasted bread with garlic butter.' },

  { id: 'choc-cake', cat: 'sweets', name: 'Chocolate cake slice', price: 4.50, desc: 'A big slice of homemade chocolate cake.' },
  { id: 'vanilla-cake', cat: 'sweets', name: 'Vanilla cake slice', price: 4.50, desc: 'Soft vanilla cake with frosting.' },
  { id: 'brownies', cat: 'sweets', name: 'Brownies (2)', price: 4.00, desc: 'Two fudgy brownies.' },
  { id: 'cookies', cat: 'sweets', name: 'Chocolate chip cookies (3)', price: 4.00, desc: 'Three warm cookies.' },

  { id: 'lemonade', cat: 'drinks', name: 'Lemonade', price: 2.50, desc: 'Cold lemonade.' },
  { id: 'iced-tea', cat: 'drinks', name: 'Iced tea', price: 2.50, desc: 'Sweet or unsweet. Tell us in the notes.' },
  { id: 'water', cat: 'drinks', name: 'Bottled water', price: 1.50, desc: 'Cold bottled water.' }
];

/* Every dish gets a picture from /img/menu/<id>.svg by default.
 * To use your own photo, upload it to the img/menu folder and add  img: '/img/menu/yourfile.jpg'  to the dish above. */
MENU.forEach(m => { if (!m.img) m.img = '/img/menu/' + m.id + '.svg'; });
