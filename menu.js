/* MasterChefHub: food menu. EDIT THIS FILE to change dishes, prices and toppings.
 * price is in dollars. cat must be one of the ids in CATS below.
 * After you edit it on GitHub, the site updates by itself. */
export const CURRENCY = 'USD';
export const FEE = 3.00;          /* flat delivery fee in dollars (use 0 for free delivery) */
export const MIN_ORDER = 0;       /* no minimum: one meal or one drink is fine */
export const VENMO = '';          /* your Venmo name shown to customers who pay with Venmo, for example '@your-name' (leave empty to hide) */
export const TIPS = [0, 10, 15, 20];   /* quick tip buttons, in percent */

/* "Fresh and homemade" costs a little more than "Basic". 7 dollar meal = 2 dollars more, big dinners = 4 more. */
export const freshExtra = price => (price < 8 ? 2 : price < 16 ? 3 : 4);

export const CATS = [
  ['all', 'All'],
  ['sandwiches', 'Sandwiches'],
  ['mains', 'Burgers and mains'],
  ['pasta', 'Pasta'],
  ['breakfast', 'Breakfast'],
  ['sides', 'Sides'],
  ['sweets', 'Cakes and sweets'],
  ['drinks', 'Drinks'],
  ['dinners', 'Dinners and platters']
];

/* ---------- choices shown when a customer picks a dish ----------
 * type 'one'  = pick exactly one (req: true) or at most one
 * type 'multi' = pick any number
 * each choice is [name, extra price in dollars]                    */
const SAUCES = [['Mayo', 0], ['Mustard', 0], ['Ketchup', 0], ['Ranch', 0.5], ['Honey mustard', 0.5], ['BBQ sauce', 0.5], ['Hot sauce', 0]];
const VEG = [['Lettuce', 0], ['Tomato', 0], ['Pickles', 0], ['Red onion', 0], ['Cucumber', 0]];
const SODAS = [['Coca-Cola', 0], ['Diet Coke', 0], ['Pepsi', 0], ['Dr Pepper', 0], ['Sprite', 0], ['Fanta Orange', 0], ['Mountain Dew', 0], ['Root beer', 0]];
export const GROUPS = {
  bread: { label: 'Bread', type: 'one', req: true, choices: [['White', 0], ['Wheat', 0], ['Sourdough', 0.5], ['Toasted white', 0]] },
  sauces: { label: 'Sauces', type: 'multi', choices: SAUCES },
  sandTop: { label: 'Toppings', type: 'multi', choices: VEG.concat([['Extra cheese', 1], ['Bacon', 2], ['Avocado', 1.5], ['Extra meat', 3]]) },
  bun: { label: 'Bun', type: 'one', req: true, choices: [['Sesame bun', 0], ['Plain bun', 0], ['Brioche bun', 0.75]] },
  patty: { label: 'Patty', type: 'one', req: true, choices: [['Single', 0], ['Double', 4]] },
  cheese: { label: 'Cheese', type: 'one', choices: [['American', 0], ['Cheddar', 0], ['Swiss', 0], ['Pepper jack', 0.5], ['No cheese', 0]] },
  burgerTop: { label: 'Toppings', type: 'multi', choices: VEG.concat([['Bacon', 2], ['Fried egg', 1.5], ['Grilled onions', 0.5], ['Jalapenos', 0.5], ['Avocado', 1.5]]) },
  dogTop: { label: 'Toppings', type: 'multi', choices: [['Mustard', 0], ['Ketchup', 0], ['Relish', 0], ['Onions', 0], ['Sauerkraut', 0.5], ['Chili', 1.5], ['Cheese', 1]] },
  mainSauce: { label: 'Sauces and dips', type: 'multi', choices: [['Sour cream', 0], ['Salsa', 0], ['Guacamole', 1.5], ['Ranch', 0.5], ['BBQ sauce', 0.5], ['Honey mustard', 0.5], ['Ketchup', 0], ['Hot sauce', 0]] },
  mainExtra: { label: 'Extras', type: 'multi', choices: [['Extra cheese', 1], ['Extra meat', 3], ['Side of rice', 2.5], ['Side of fries', 3]] },
  soupExtra: { label: 'Extras', type: 'multi', choices: [['Crackers', 0], ['Grated cheese', 0.5], ['Grilled cheese on the side', 4.5], ['Extra bread', 1.5]] },
  pastaType: { label: 'Pasta', type: 'one', req: true, choices: [['Spaghetti', 0], ['Penne', 0], ['Rigatoni', 0], ['Shells', 0]] },
  pastaExtra: { label: 'Toppings', type: 'multi', choices: [['Parmesan', 0], ['Extra sauce', 1], ['Meatballs', 4], ['Grilled chicken', 4.5], ['Mushrooms', 1.5], ['Garlic bread', 3.5]] },
  bfTop: { label: 'Toppings and sides', type: 'multi', choices: [['Butter', 0], ['Maple syrup', 0], ['Whipped cream', 0.75], ['Strawberries', 1.5], ['Blueberries', 1.5], ['Chocolate chips', 1], ['Bacon (2)', 2.5], ['Sausage (2)', 2.5]] },
  eggs: { label: 'Eggs', type: 'one', req: true, choices: [['Scrambled', 0], ['Fried', 0], ['Over easy', 0], ['Sunny side up', 0]] },
  omeFill: { label: 'Fillings', type: 'multi', choices: [['Cheese', 0], ['Ham', 1], ['Peppers', 0.5], ['Onions', 0.5], ['Mushrooms', 1], ['Spinach', 0.5]] },
  sideDip: { label: 'Dips', type: 'multi', choices: [['Ketchup', 0], ['Ranch', 0.5], ['Cheese sauce', 1], ['BBQ sauce', 0.5], ['Honey mustard', 0.5], ['Garlic mayo', 0.5]] },
  sideSize: { label: 'Size', type: 'one', req: true, choices: [['Regular', 0], ['Large', 2]] },
  sideExtra: { label: 'Extras', type: 'multi', choices: [['Extra butter', 0.5], ['Grated cheese', 1], ['Bacon bits', 1.5]] },
  dressing: { label: 'Dressing', type: 'one', req: true, choices: [['Ranch', 0], ['Italian', 0], ['Caesar', 0], ['Balsamic', 0], ['No dressing', 0]] },
  saladTop: { label: 'Toppings', type: 'multi', choices: [['Croutons', 0.5], ['Cheese', 1], ['Grilled chicken', 4.5], ['Bacon bits', 1.5], ['Avocado', 1.5]] },
  sweetExtra: { label: 'Extras', type: 'multi', choices: [['Scoop of vanilla ice cream', 2], ['Whipped cream', 0.75], ['Chocolate sauce', 0.75], ['Caramel sauce', 0.75], ['Sprinkles', 0.5], ['Warm it up', 0]] },
  iceOpt: { label: 'Ice', type: 'one', req: true, choices: [['Regular ice', 0], ['Light ice', 0], ['No ice', 0]] },
  soda: { label: 'Which soda?', type: 'one', req: true, choices: SODAS },
  sodaKind: { label: 'Which soda?', type: 'one', req: true, choices: SODAS },
  beer: { label: 'Which beer?', type: 'one', req: true, choices: [['Bud Light', 0], ['Coors Light', 0], ['Miller Lite', 0], ['Corona', 0.5], ['Modelo', 0.5], ['Heineken', 1], ['Stella Artois', 1], ['Blue Moon', 1]] },
  tea: { label: 'Tea', type: 'one', req: true, choices: [['Sweet', 0], ['Unsweet', 0], ['Half and half', 0]] },
  lemon: { label: 'Flavor', type: 'one', req: true, choices: [['Classic', 0], ['Strawberry', 0.5], ['Peach', 0.5], ['Mint', 0.5]] },
  juiceSize: { label: 'Size', type: 'one', req: true, choices: [['Regular', 0], ['Large', 1.5]] },
  shakeFlavor: { label: 'Flavor', type: 'one', req: true, choices: [['Strawberry', 0], ['Chocolate', 0], ['Vanilla', 0], ['Cookies and cream', 0.75]] },
  hotExtra: { label: 'Extras', type: 'multi', choices: [['Marshmallows', 0], ['Whipped cream', 0.5], ['Caramel drizzle', 0.5]] },
  coffeeHow: { label: 'How do you like it?', type: 'one', req: true, choices: [['Hot', 0], ['Iced', 0]] },
  coffeeAdd: { label: 'Add', type: 'multi', choices: [['Cream', 0], ['Sugar', 0], ['Milk', 0], ['Vanilla', 0.5], ['Caramel', 0.5]] },
  waterKind: { label: 'Water', type: 'one', req: true, choices: [['Still', 0], ['Sparkling', 0.5]] },
  steakTemp: { label: 'How do you want it cooked?', type: 'one', req: true, choices: [['Rare', 0], ['Medium rare', 0], ['Medium', 0], ['Medium well', 0], ['Well done', 0]] },
  steakTop: { label: 'Add on top', type: 'multi', choices: [['Garlic butter', 1], ['Grilled onions', 1], ['Mushrooms', 1.5], ['Steak sauce', 0]] },
  dinnerSide: { label: 'Extra sides', type: 'multi', choices: [['Mac and cheese', 7], ['Coleslaw', 5], ['Garlic bread', 4.5], ['Salad', 6], ['Corn on the cob', 4.5], ['Mashed potatoes', 5]] },
  wingSauce: { label: 'Wing sauce', type: 'one', req: true, choices: [['Mild buffalo', 0], ['Hot buffalo', 0], ['BBQ', 0], ['Garlic parmesan', 0], ['Honey garlic', 0], ['Plain, no sauce', 0]] },
  wingDip: { label: 'Dip', type: 'one', choices: [['Ranch', 0], ['Blue cheese', 0], ['No dip', 0]] },
  pizzaTop: { label: 'Toppings', type: 'multi', choices: [['Pepperoni', 0], ['Sausage', 1.5], ['Mushrooms', 1], ['Peppers', 1], ['Onions', 0.5], ['Olives', 1], ['Extra cheese', 2]] }
};
/* which groups each kind of dish shows */
export const SETS = {
  sandwich: ['bread', 'sauces', 'sandTop'], burger: ['bun', 'patty', 'cheese', 'sauces', 'burgerTop'], hotdog: ['dogTop', 'sauces'],
  main: ['mainSauce', 'mainExtra'], soup: ['soupExtra'], pasta: ['pastaType', 'pastaExtra'], breakfast: ['bfTop'], omelette: ['omeFill', 'bfTop'],
  side: ['sideDip', 'sideSize', 'sideExtra'], salad: ['dressing', 'saladTop'], sweet: ['sweetExtra'],
  soda: ['soda', 'iceOpt'], soda2: ['sodaKind'], beer: ['beer'], cold: ['lemon', 'iceOpt'], tea: ['tea', 'iceOpt'], shake: ['shakeFlavor', 'hotExtra'], hot: ['hotExtra'], coffee: ['coffeeHow', 'coffeeAdd'], water: ['waterKind'],
  steak: ['steakTemp', 'steakTop', 'dinnerSide'], dinner: ['dinnerSide'], wings: ['wingSauce', 'wingDip', 'dinnerSide'], pizza: ['pizzaTop']
};
const DEFAULT_SET = { sandwiches: 'sandwich', mains: 'main', pasta: 'pasta', breakfast: 'breakfast', sides: 'side', sweets: 'sweet', drinks: 'cold', dinners: 'dinner' };

export const MENU = [
  { id: 'grilled-cheese', cat: 'sandwiches', name: 'Grilled cheese', price: 8.00, desc: 'Toasted bread with melted cheese.' },
  { id: 'turkey-sandwich', cat: 'sandwiches', name: 'Turkey sandwich', price: 10.50, desc: 'Turkey, lettuce, tomato and mayo on soft bread.' },
  { id: 'blt', cat: 'sandwiches', name: 'BLT sandwich', price: 11.00, desc: 'Crispy bacon, lettuce and tomato on toast.' },
  { id: 'ham-cheese', cat: 'sandwiches', name: 'Ham and cheese', price: 10.00, desc: 'Sliced ham and cheese, cold or toasted.' },
  { id: 'club', cat: 'sandwiches', name: 'Club sandwich', price: 13.50, desc: 'Three layers of toast, turkey, bacon, lettuce and tomato.' },
  { id: 'chicken-sandwich', cat: 'sandwiches', name: 'Crispy chicken sandwich', price: 13.00, desc: 'Crunchy chicken on a bun with lettuce and tomato.' },
  { id: 'pbj', cat: 'sandwiches', name: 'Peanut butter and jelly', price: 6.00, desc: 'A classic. Tell us in the notes if there is a nut allergy.' },
  { id: 'cheeseburger', cat: 'mains', name: 'Cheeseburger', price: 13.50, desc: 'Beef patty, melted cheese, lettuce and tomato on a bun.', set: 'burger' },
  { id: 'hamburger', cat: 'mains', name: 'Hamburger', price: 12.00, desc: 'A juicy beef patty with lettuce and tomato.', set: 'burger' },
  { id: 'hotdog', cat: 'mains', name: 'Hot dog', price: 7.50, desc: 'A grilled hot dog in a soft bun with mustard.', set: 'hotdog' },
  { id: 'tacos', cat: 'mains', name: 'Tacos (3)', price: 14.00, desc: 'Three crunchy tacos with beef, lettuce and tomato.', set: 'main' },
  { id: 'quesadilla', cat: 'mains', name: 'Cheese quesadilla', price: 11.00, desc: 'A grilled tortilla filled with melted cheese.', set: 'main' },
  { id: 'pizza-slice', cat: 'mains', name: 'Pepperoni pizza (2 slices)', price: 10.50, desc: 'Two big slices with cheese and pepperoni.', set: 'main' },
  { id: 'nuggets', cat: 'mains', name: 'Chicken nuggets (8)', price: 11.00, desc: 'Eight golden nuggets with a dipping sauce.', set: 'main' },
  { id: 'chicken-rice', cat: 'mains', name: 'Chicken and rice', price: 15.00, desc: 'Baked chicken with white rice and green veggies.', set: 'main' },
  { id: 'fried-rice', cat: 'mains', name: 'Egg fried rice', price: 12.00, desc: 'Rice fried with egg, peas and carrots.', set: 'main' },
  { id: 'tomato-soup', cat: 'mains', name: 'Tomato soup', price: 8.00, desc: 'Warm tomato soup, great with a grilled cheese.', set: 'soup' },
  { id: 'chicken-soup', cat: 'mains', name: 'Chicken noodle soup', price: 10.00, desc: 'Chicken, noodles and carrots in a warm broth.', set: 'soup' },
  { id: 'spaghetti-meat', cat: 'pasta', name: 'Spaghetti with meat sauce', price: 14.00, desc: 'Spaghetti with a simple tomato and beef sauce.' },
  { id: 'mac-cheese', cat: 'pasta', name: 'Mac and cheese', price: 12.00, desc: 'Creamy baked macaroni and cheese.' },
  { id: 'butter-noodles', cat: 'pasta', name: 'Buttered noodles', price: 9.00, desc: 'Noodles with butter, a little garlic and parmesan.' },
  { id: 'alfredo', cat: 'pasta', name: 'Chicken alfredo', price: 16.50, desc: 'Fettuccine with chicken in a creamy sauce.' },
  { id: 'lasagna', cat: 'pasta', name: 'Beef lasagna', price: 17.00, desc: 'Layers of pasta, beef sauce and cheese.' },
  { id: 'eggs-toast', cat: 'breakfast', name: 'Scrambled eggs and toast', price: 9.00, desc: 'Three scrambled eggs with buttered toast.' },
  { id: 'pancakes', cat: 'breakfast', name: 'Pancakes', price: 10.50, desc: 'A stack of fluffy pancakes with syrup.' },
  { id: 'breakfast-sandwich', cat: 'breakfast', name: 'Egg and cheese sandwich', price: 8.00, desc: 'Fried egg and cheese on a toasted bun.' },
  { id: 'omelette', cat: 'breakfast', name: 'Cheese omelette', price: 10.50, desc: 'A fluffy three-egg omelette with cheese and herbs.', set: 'omelette' },
  { id: 'french-toast', cat: 'breakfast', name: 'French toast', price: 11.00, desc: 'Golden toast with syrup and fresh strawberries.' },
  { id: 'waffles', cat: 'breakfast', name: 'Waffles', price: 11.00, desc: 'A crispy waffle with butter and syrup.' },
  { id: 'oatmeal', cat: 'breakfast', name: 'Oatmeal bowl', price: 8.00, desc: 'Warm oatmeal with blueberries, banana and honey.' },
  { id: 'fries', cat: 'sides', name: 'French fries', price: 5.00, desc: 'Hot, crispy and lightly salted.' },
  { id: 'salad', cat: 'sides', name: 'Side salad', price: 6.00, desc: 'Lettuce, tomato and cucumber with dressing.', set: 'salad' },
  { id: 'garlic-bread', cat: 'sides', name: 'Garlic bread', price: 5.00, desc: 'Toasted bread with garlic butter.' },
  { id: 'onion-rings', cat: 'sides', name: 'Onion rings', price: 7.00, desc: 'Crunchy golden onion rings.' },
  { id: 'mashed-potatoes', cat: 'sides', name: 'Mashed potatoes', price: 6.00, desc: 'Creamy mashed potatoes with gravy and butter.', set: 'side' },
  { id: 'corn', cat: 'sides', name: 'Buttered corn (2)', price: 5.00, desc: 'Two sweet corn cobs with butter.', set: 'side' },
  { id: 'choc-cake', cat: 'sweets', name: 'Chocolate cake slice', price: 7.00, desc: 'A big slice of homemade chocolate cake.' },
  { id: 'vanilla-cake', cat: 'sweets', name: 'Vanilla cake slice', price: 7.00, desc: 'Soft vanilla cake with cream and a cherry.' },
  { id: 'brownies', cat: 'sweets', name: 'Brownies (2)', price: 6.00, desc: 'Two fudgy brownies.' },
  { id: 'cookies', cat: 'sweets', name: 'Chocolate chip cookies (3)', price: 6.00, desc: 'Three warm cookies.' },
  { id: 'cupcake', cat: 'sweets', name: 'Strawberry cupcake', price: 5.00, desc: 'A soft cupcake with pink frosting.' },
  { id: 'apple-pie', cat: 'sweets', name: 'Apple pie slice', price: 7.00, desc: 'Warm apple pie with a flaky crust.' },
  { id: 'banana-bread', cat: 'sweets', name: 'Banana bread (2 slices)', price: 6.00, desc: 'Moist banana bread with walnuts.' },
  { id: 'ice-cream', cat: 'sweets', name: 'Ice cream cone', price: 5.00, desc: 'Two scoops in a crunchy cone.' },
  { id: 'lemonade', cat: 'drinks', name: 'Lemonade', price: 3.50, desc: 'Cold lemonade.', set: 'cold' },
  { id: 'iced-tea', cat: 'drinks', name: 'Iced tea', price: 3.50, desc: 'Sweet or unsweet. Tell us in the notes.', set: 'tea' },
  { id: 'orange-juice', cat: 'drinks', name: 'Orange juice', price: 4.00, desc: 'Cold orange juice.', set: 'cold' },
  { id: 'milkshake', cat: 'drinks', name: 'Strawberry milkshake', price: 6.50, desc: 'Thick and creamy, with whipped cream.', set: 'shake' },
  { id: 'hot-chocolate', cat: 'drinks', name: 'Hot chocolate', price: 5.00, desc: 'Warm cocoa with marshmallows.', set: 'hot' },
  { id: 'coffee', cat: 'drinks', name: 'Coffee', price: 3.50, desc: 'Fresh hot coffee.', set: 'coffee' },
  { id: 'soda', cat: 'drinks', name: 'Soda can', price: 2.50, desc: 'A cold fizzy soda.', set: 'soda', fresh: false },
  { id: 'water', cat: 'drinks', name: 'Bottled water', price: 2.00, desc: 'Cold bottled water.', set: 'water', fresh: false },
  { id: 'ribeye-dinner', cat: 'dinners', name: 'Ribeye steak dinner', price: 34.00, desc: 'A thick ribeye cooked how you like it, with mashed potatoes and buttered corn.', set: 'steak' },
  { id: 'bbq-ribs', cat: 'dinners', name: 'BBQ ribs, full rack', price: 33.00, desc: 'A full rack of slow-cooked ribs with sticky BBQ sauce and two sides.', set: 'dinner' },
  { id: 'burger-feast', cat: 'dinners', name: 'Burger feast for 4', price: 35.00, desc: 'Four cheeseburgers with a big basket of fries. Feeds four.', set: 'dinner' },
  { id: 'sandwich-platter', cat: 'dinners', name: 'Party sandwich platter', price: 32.00, desc: 'A tray of mixed sandwiches cut into triangles. Feeds six.', set: 'dinner' },
  { id: 'taco-night', cat: 'dinners', name: 'Taco night for 4', price: 30.00, desc: 'A dozen tacos with rice, beans and toppings on the side. Feeds four.', set: 'dinner' },
  { id: 'family-lasagna', cat: 'dinners', name: 'Family lasagna tray', price: 29.00, desc: 'A big tray of lasagna with garlic bread. Feeds four.', set: 'dinner' },
  { id: 'roast-chicken', cat: 'dinners', name: 'Whole roast chicken dinner', price: 28.00, desc: 'A whole roast chicken with two sides. Feeds three or four.', set: 'dinner' },
  { id: 'shrimp-scampi', cat: 'dinners', name: 'Garlic butter shrimp pasta', price: 27.00, desc: 'Pasta with plenty of shrimp in garlic butter sauce.', set: 'dinner' },
  { id: 'spaghetti-tray', cat: 'dinners', name: 'Spaghetti and meatballs tray', price: 26.00, desc: 'A tray of spaghetti with homemade meatballs. Feeds four.', set: 'dinner' },
  { id: 'wings-24', cat: 'dinners', name: 'Chicken wings (24)', price: 26.00, desc: 'Two dozen wings in your favorite sauce, with dip.', set: 'wings' },
  { id: 'pizza-party', cat: 'dinners', name: 'Party pizza (large)', price: 25.00, desc: 'A large homemade pizza with your toppings. Cut in 12.', set: 'pizza' },
  { id: 'whole-cake', cat: 'dinners', name: 'Whole chocolate cake', price: 30.00, desc: 'A full chocolate cake, enough for a party of ten.', set: 'dinner' },
  { id: 'dessert-box', cat: 'dinners', name: 'Dessert box', price: 25.00, desc: 'Cupcakes, brownies and cookies in one box. About a dozen treats.', set: 'dinner' },
  { id: 'soda-2l', cat: 'drinks', name: 'Soda, 2 liter', price: 6.00, desc: 'A big cold bottle to share. Pick your brand.', set: 'soda2', img: '/img/menu/soda.svg', fresh: false },
  { id: 'soda-6', cat: 'drinks', name: 'Soda, 6 pack', price: 9.00, desc: 'Six cold cans. Pick your brand.', set: 'soda2', img: '/img/menu/soda.svg', fresh: false },
  { id: 'beer', cat: 'drinks', name: 'Beer (bottle)', price: 5.50, desc: 'A cold bottle of beer. 21 and over only, ID checked at the door.', set: 'beer', img: '/img/menu/beer.svg', fresh: false, alcohol: true },
  { id: 'beer-6', cat: 'drinks', name: 'Beer, 6 pack', price: 13.00, desc: 'Six cold bottles. 21 and over only, ID checked at the door.', set: 'beer', img: '/img/menu/beer.svg', fresh: false, alcohol: true }
];

/* Every dish gets a picture from /img/menu/<id>.svg by default.
 * To use your own photo, upload it to the img/menu folder and add  img: '/img/menu/yourfile.jpg'  to the dish above. */
MENU.forEach(m => {
  if (!m.img) m.img = '/img/menu/' + m.id + '.svg';
  m.set = m.set || DEFAULT_SET[m.cat];
  m.groups = (SETS[m.set] || []).map(id => Object.assign({ id }, GROUPS[id]));
  m.canFresh = m.fresh !== false;
});
