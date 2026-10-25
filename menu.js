/* MasterChefHub: food menu. EDIT THIS FILE to change dishes and prices.
 * price is in dollars. cat must be one of the ids in CATS below.
 * After you edit it on GitHub, the site updates by itself. */
export const CURRENCY = 'USD';
export const FEE = 3.00;          /* flat delivery fee in dollars (use 0 for free delivery) */
export const MIN_ORDER = 8.00;    /* smallest food total allowed, in dollars (0 for no minimum) */

export const CATS = [
  ['all', 'All'],
  ['sandwiches', 'Sandwiches'],
  ['mains', 'Burgers and mains'],
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
  { id: 'ham-cheese', cat: 'sandwiches', name: 'Ham and cheese', price: 6.50, desc: 'Sliced ham and cheese, cold or toasted.' },
  { id: 'club', cat: 'sandwiches', name: 'Club sandwich', price: 9.00, desc: 'Three layers of toast, turkey, bacon, lettuce and tomato.' },
  { id: 'chicken-sandwich', cat: 'sandwiches', name: 'Crispy chicken sandwich', price: 8.50, desc: 'Crunchy chicken on a bun with lettuce and tomato.' },
  { id: 'pbj', cat: 'sandwiches', name: 'Peanut butter and jelly', price: 4.00, desc: 'A classic. Tell us in the notes if there is a nut allergy.' },
  { id: 'cheeseburger', cat: 'mains', name: 'Cheeseburger', price: 9.00, desc: 'Beef patty, melted cheese, lettuce and tomato on a bun.' },
  { id: 'hamburger', cat: 'mains', name: 'Hamburger', price: 8.00, desc: 'A juicy beef patty with lettuce and tomato.' },
  { id: 'hotdog', cat: 'mains', name: 'Hot dog', price: 5.00, desc: 'A grilled hot dog in a soft bun with mustard.' },
  { id: 'tacos', cat: 'mains', name: 'Tacos (3)', price: 9.50, desc: 'Three crunchy tacos with beef, lettuce and tomato.' },
  { id: 'quesadilla', cat: 'mains', name: 'Cheese quesadilla', price: 7.50, desc: 'A grilled tortilla filled with melted cheese.' },
  { id: 'pizza-slice', cat: 'mains', name: 'Pepperoni pizza (2 slices)', price: 7.00, desc: 'Two big slices with cheese and pepperoni.' },
  { id: 'nuggets', cat: 'mains', name: 'Chicken nuggets (8)', price: 7.50, desc: 'Eight golden nuggets with a dipping sauce.' },
  { id: 'chicken-rice', cat: 'mains', name: 'Chicken and rice', price: 10.00, desc: 'Baked chicken with white rice and green veggies.' },
  { id: 'fried-rice', cat: 'mains', name: 'Egg fried rice', price: 8.00, desc: 'Rice fried with egg, peas and carrots.' },
  { id: 'tomato-soup', cat: 'mains', name: 'Tomato soup', price: 5.50, desc: 'Warm tomato soup, great with a grilled cheese.' },
  { id: 'chicken-soup', cat: 'mains', name: 'Chicken noodle soup', price: 6.50, desc: 'Chicken, noodles and carrots in a warm broth.' },
  { id: 'spaghetti-meat', cat: 'pasta', name: 'Spaghetti with meat sauce', price: 9.50, desc: 'Spaghetti with a simple tomato and beef sauce.' },
  { id: 'mac-cheese', cat: 'pasta', name: 'Mac and cheese', price: 8.00, desc: 'Creamy baked macaroni and cheese.' },
  { id: 'butter-noodles', cat: 'pasta', name: 'Buttered noodles', price: 6.00, desc: 'Noodles with butter, a little garlic and parmesan.' },
  { id: 'alfredo', cat: 'pasta', name: 'Chicken alfredo', price: 11.00, desc: 'Fettuccine with chicken in a creamy sauce.' },
  { id: 'lasagna', cat: 'pasta', name: 'Beef lasagna', price: 11.50, desc: 'Layers of pasta, beef sauce and cheese.' },
  { id: 'eggs-toast', cat: 'breakfast', name: 'Scrambled eggs and toast', price: 6.00, desc: 'Three scrambled eggs with buttered toast.' },
  { id: 'pancakes', cat: 'breakfast', name: 'Pancakes', price: 7.00, desc: 'A stack of fluffy pancakes with syrup.' },
  { id: 'breakfast-sandwich', cat: 'breakfast', name: 'Egg and cheese sandwich', price: 5.50, desc: 'Fried egg and cheese on a toasted bun.' },
  { id: 'omelette', cat: 'breakfast', name: 'Cheese omelette', price: 7.00, desc: 'A fluffy three-egg omelette with cheese and herbs.' },
  { id: 'french-toast', cat: 'breakfast', name: 'French toast', price: 7.50, desc: 'Golden toast with syrup and fresh strawberries.' },
  { id: 'waffles', cat: 'breakfast', name: 'Waffles', price: 7.50, desc: 'A crispy waffle with butter and syrup.' },
  { id: 'oatmeal', cat: 'breakfast', name: 'Oatmeal bowl', price: 5.50, desc: 'Warm oatmeal with blueberries, banana and honey.' },
  { id: 'fries', cat: 'sides', name: 'French fries', price: 3.50, desc: 'Hot, crispy and lightly salted.' },
  { id: 'salad', cat: 'sides', name: 'Side salad', price: 4.00, desc: 'Lettuce, tomato and cucumber with dressing.' },
  { id: 'garlic-bread', cat: 'sides', name: 'Garlic bread', price: 3.50, desc: 'Toasted bread with garlic butter.' },
  { id: 'onion-rings', cat: 'sides', name: 'Onion rings', price: 4.50, desc: 'Crunchy golden onion rings.' },
  { id: 'mashed-potatoes', cat: 'sides', name: 'Mashed potatoes', price: 4.00, desc: 'Creamy mashed potatoes with gravy and butter.' },
  { id: 'corn', cat: 'sides', name: 'Buttered corn (2)', price: 3.50, desc: 'Two sweet corn cobs with butter.' },
  { id: 'choc-cake', cat: 'sweets', name: 'Chocolate cake slice', price: 4.50, desc: 'A big slice of homemade chocolate cake.' },
  { id: 'vanilla-cake', cat: 'sweets', name: 'Vanilla cake slice', price: 4.50, desc: 'Soft vanilla cake with cream and a cherry.' },
  { id: 'brownies', cat: 'sweets', name: 'Brownies (2)', price: 4.00, desc: 'Two fudgy brownies.' },
  { id: 'cookies', cat: 'sweets', name: 'Chocolate chip cookies (3)', price: 4.00, desc: 'Three warm cookies.' },
  { id: 'cupcake', cat: 'sweets', name: 'Strawberry cupcake', price: 3.50, desc: 'A soft cupcake with pink frosting.' },
  { id: 'apple-pie', cat: 'sweets', name: 'Apple pie slice', price: 4.50, desc: 'Warm apple pie with a flaky crust.' },
  { id: 'banana-bread', cat: 'sweets', name: 'Banana bread (2 slices)', price: 4.00, desc: 'Moist banana bread with walnuts.' },
  { id: 'ice-cream', cat: 'sweets', name: 'Ice cream cone', price: 3.50, desc: 'Two scoops in a crunchy cone.' },
  { id: 'lemonade', cat: 'drinks', name: 'Lemonade', price: 2.50, desc: 'Cold lemonade.' },
  { id: 'iced-tea', cat: 'drinks', name: 'Iced tea', price: 2.50, desc: 'Sweet or unsweet. Tell us in the notes.' },
  { id: 'orange-juice', cat: 'drinks', name: 'Orange juice', price: 3.00, desc: 'Cold orange juice.' },
  { id: 'milkshake', cat: 'drinks', name: 'Strawberry milkshake', price: 4.50, desc: 'Thick and creamy, with whipped cream.' },
  { id: 'hot-chocolate', cat: 'drinks', name: 'Hot chocolate', price: 3.50, desc: 'Warm cocoa with marshmallows.' },
  { id: 'coffee', cat: 'drinks', name: 'Coffee', price: 2.50, desc: 'Fresh hot coffee.' },
  { id: 'soda', cat: 'drinks', name: 'Soda can', price: 1.75, desc: 'A cold fizzy soda.' },
  { id: 'water', cat: 'drinks', name: 'Bottled water', price: 1.50, desc: 'Cold bottled water.' }
];

/* Every dish gets a picture from /img/menu/<id>.svg by default.
 * To use your own photo, upload it to the img/menu folder and add  img: '/img/menu/yourfile.jpg'  to the dish above. */
MENU.forEach(m => { if (!m.img) m.img = '/img/menu/' + m.id + '.svg'; });
