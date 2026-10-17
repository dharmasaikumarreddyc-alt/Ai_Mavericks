"""Base utilities for Aisle Marketplace - Agentic AI Checkout."""
# ============================================================
# SYNTHETIC DEMO CATALOG - no affiliation with real merchants.
# In production: use verified merchant onboarding and live inventory feeds.
# ============================================================

MERCHANTS = {
    "cafe-verde": {
        "id": "cafe-verde",
        "name": "Aisle Coffee Lab",
        "type": "Coffee Shop",
        "category": "Food & Beverage",
        "rating": 4.7,
        "reviews": 234,
        "distance": 0.1,
        "address": "100 Demo Market St, Atlanta, GA 30326",
        "image": "/images/products/cafe-verde.jpg",
        "tags": ["vegan", "organic", "breakfast", "coffee", "healthy"],
        "hours": "7:00 AM - 4:00 PM",
        "offers": [
            {"title": "10% off orders above $10", "code": "VERDE10"},
            {"title": "Free coffee with breakfast combo", "code": "FREECOFFE"}
        ],
        "loyalty": {"points_per_dollar": 2, "reward": "Free drink after 50 points"},
        "catalog": [
            {"id": "cv-1", "name": "Vegan Avocado Toast", "price": 8.50, "category": "Breakfast", "description": "Sourdough with smashed avocado, cherry tomatoes & microgreens", "tags": ["vegan", "healthy", "breakfast"], "available": True, "image": "/images/products/avocado-toast.jpg"},
            {"id": "cv-2", "name": "Oat Milk Latte", "price": 5.75, "category": "Drinks", "description": "Double shot espresso with creamy oat milk", "tags": ["vegan", "coffee", "latte"], "available": True, "image": "/images/products/latte.jpg"},
            {"id": "cv-3", "name": "Vegan Buddha Bowl", "price": 12.50, "category": "Breakfast", "description": "Quinoa, roasted veggies, hummus & tahini dressing", "tags": ["vegan", "healthy", "protein", "bowl"], "available": True, "image": "/images/products/buddha-bowl.jpg"},
            {"id": "cv-4", "name": "Fresh Orange Juice", "price": 4.50, "category": "Drinks", "description": "Freshly squeezed orange juice", "tags": ["vegan", "fresh", "healthy", "juice"], "available": True, "image": "/images/products/orange-juice.jpg"},
            {"id": "cv-5", "name": "Almond Croissant", "price": 4.25, "category": "Bakery", "description": "Flaky croissant with almond paste", "tags": ["bakery", "pastry", "croissant"], "available": True, "image": "/images/products/croissant.jpg"},
            {"id": "cv-6", "name": "Cappuccino", "price": 5.50, "category": "Drinks", "description": "Classic cappuccino with steamed milk foam", "tags": ["coffee", "cappuccino"], "available": True, "image": "/images/products/cappuccino.jpg"},
            {"id": "cv-7", "name": "Blueberry Muffin", "price": 3.75, "category": "Bakery", "description": "Fresh baked muffin with juicy blueberries", "tags": ["bakery", "muffin", "blueberry"], "available": True, "image": "/images/products/blueberry-muffin.jpg"},
            {"id": "cv-8", "name": "Mocha", "price": 6.25, "category": "Drinks", "description": "Espresso with chocolate and steamed milk", "tags": ["coffee", "mocha", "chocolate"], "available": True, "image": "/images/products/mocha.jpg"},
            {"id": "cv-9", "name": "French Toast", "price": 9.50, "category": "Breakfast", "description": "Classic french toast with maple syrup", "tags": ["breakfast", "french toast"], "available": True, "image": "/images/products/french-toast.jpg"},
            {"id": "cv-10", "name": "Tea", "price": 3.25, "category": "Drinks", "description": "Premium organic tea selection", "tags": ["tea", "hot beverage"], "available": True, "image": "/images/products/tea.jpg"},
        ]
    },
    "green-leaf-bistro": {
        "id": "green-leaf-bistro",
        "name": "Green Leaf Bistro",
        "type": "Health Restaurant",
        "category": "Food & Beverage",
        "rating": 4.5,
        "reviews": 189,
        "distance": 0.3,
        "address": "120 Demo Market St, Atlanta, GA 30326",
        "image": "/images/products/green-leaf-bistro.jpg",
        "tags": ["vegan", "salads", "healthy", "lunch", "organic"],
        "hours": "8:00 AM - 9:00 PM",
        "offers": [
            {"title": "Buy 1 Get 1 on salads (Mon-Wed)", "code": "BOGO"}
        ],
        "loyalty": {"points_per_dollar": 3, "reward": "$5 off after 75 points"},
        "catalog": [
            {"id": "gl-1", "name": "Mediterranean Salad", "price": 11.50, "category": "Salads", "description": "Mixed greens, olives, feta, cucumber & olive oil dressing", "tags": ["salad", "healthy", "mediterranean"], "available": True, "image": "/images/products/mediterranean-salad.jpg"},
            {"id": "gl-2", "name": "Quinoa Power Bowl", "price": 13.50, "category": "Bowls", "description": "Protein-packed quinoa with roasted chickpeas & veggies", "tags": ["vegan", "protein", "healthy", "bowl", "quinoa"], "available": True, "image": "/images/products/quinoa-bowl.jpg"},
            {"id": "gl-3", "name": "Smoothie Bowl", "price": 10.50, "category": "Breakfast", "description": "Acai, banana, berries & granola topping", "tags": ["vegan", "fruits", "breakfast", "smoothie"], "available": True, "image": "/images/products/smoothie-bowl.jpg"},
            {"id": "gl-4", "name": "Caesar Salad", "price": 10.75, "category": "Salads", "description": "Crisp romaine with parmesan and croutons", "tags": ["salad", "caesar", "classic"], "available": True, "image": "/images/products/caesar-salad.jpg"},
            {"id": "gl-5", "name": "Greek Salad", "price": 11.00, "category": "Salads", "description": "Fresh veggies with feta cheese and olives", "tags": ["salad", "greek", "feta"], "available": True, "image": "/images/products/greek-salad.jpg"},
            {"id": "gl-6", "name": "Garden Salad", "price": 9.50, "category": "Salads", "description": "Fresh mixed greens with house dressing", "tags": ["salad", "garden", "fresh"], "available": True, "image": "/images/products/garden-salad.jpg"},
            {"id": "gl-7", "name": "Fruit Salad", "price": 7.50, "category": "Healthy", "description": "Seasonal fresh fruit mix", "tags": ["fruits", "fresh", "healthy"], "available": True, "image": "/images/products/fruit-salad.jpg"},
            {"id": "gl-8", "name": "Protein Salad", "price": 13.00, "category": "Salads", "description": "Grilled chicken with mixed greens", "tags": ["salad", "protein", "chicken"], "available": True, "image": "/images/products/protein-salad.jpg"},
            {"id": "gl-9", "name": "Oatmeal Bowl", "price": 7.00, "category": "Breakfast", "description": "Warm oats with fruits and honey", "tags": ["breakfast", "oatmeal", "healthy"], "available": True, "image": "/images/products/oatmeal.jpg"},
            {"id": "gl-10", "name": "Greek Yogurt Parfait", "price": 8.50, "category": "Breakfast", "description": "Creamy yogurt with granola and berries", "tags": ["breakfast", "yogurt", "granola"], "available": True, "image": "/images/products/yogurt.jpg"},
        ]
    },
    "bean-scene-coffee": {
        "id": "bean-scene-coffee",
        "name": "Bean Scene Coffee",
        "type": "Coffee Shop",
        "category": "Food & Beverage",
        "rating": 4.8,
        "reviews": 456,
        "distance": 0.5,
        "address": "110 Demo Market St, Atlanta, GA 30326",
        "image": "/images/products/bean-scene-coffee.jpg",
        "tags": ["coffee", "breakfast", "vegan-options", "workspace", "wifi"],
        "hours": "6:30 AM - 11:00 PM",
        "offers": [
            {"title": "Happy Hour 3-5 PM: 20% off", "code": "HAPPY20"},
            {"title": "Student discount 15%", "code": "STUDENT15"}
        ],
        "loyalty": {"points_per_dollar": 2, "reward": "Free pastry after 40 points"},
        "catalog": [
            {"id": "bs-1", "name": "Signature Cold Brew", "price": 5.50, "category": "Drinks", "description": "18-hour slow steeped cold brew", "tags": ["coffee", "cold brew", "signature"], "available": True, "image": "/images/products/cold-brew.jpg"},
            {"id": "bs-2", "name": "Vegan Breakfast Platter", "price": 14.50, "category": "Breakfast", "description": "Toast, avocado, mushrooms, tomatoes & hash browns", "tags": ["vegan", "healthy", "breakfast", "platter"], "available": True, "image": "/images/products/breakfast-platter.jpg"},
            {"id": "bs-3", "name": "Espresso Shot", "price": 3.50, "category": "Drinks", "description": "Single origin espresso", "tags": ["coffee", "espresso", "strong"], "available": True, "image": "/images/products/espresso.jpg"},
            {"id": "bs-4", "name": "Avocado Sandwich", "price": 9.75, "category": "Snacks", "description": "Multigrain bread with avocado, spinach & tomato", "tags": ["vegan", "healthy", "sandwich", "avocado"], "available": True, "image": "/images/products/avocado-sandwich.jpg"},
            {"id": "bs-5", "name": "Pancakes Stack", "price": 10.50, "category": "Breakfast", "description": "Fluffy pancakes with maple syrup and butter", "tags": ["breakfast", "pancakes", "sweet"], "available": True, "image": "/images/products/pancakes.jpg"},
            {"id": "bs-6", "name": "Belgian Waffles", "price": 11.00, "category": "Breakfast", "description": "Crispy waffles with fresh berries", "tags": ["breakfast", "waffles", "berries"], "available": True, "image": "/images/products/waffles.jpg"},
            {"id": "bs-7", "name": "Fresh Bagel", "price": 4.50, "category": "Bakery", "description": "Toasted bagel with cream cheese", "tags": ["bakery", "bagel", "breakfast"], "available": True, "image": "/images/products/bagel.jpg"},
            {"id": "bs-8", "name": "Artisan Cookies", "price": 3.75, "category": "Bakery", "description": "Freshly baked chocolate chip cookies", "tags": ["bakery", "cookies", "dessert"], "available": True, "image": "/images/products/cookies.jpg"},
            {"id": "bs-9", "name": "Green Smoothie", "price": 6.50, "category": "Drinks", "description": "Spinach, banana, and apple blend", "tags": ["smoothie", "healthy", "green"], "available": True, "image": "/images/products/green-smoothie.jpg"},
            {"id": "bs-10", "name": "Fresh Bread Loaf", "price": 5.00, "category": "Bakery", "description": "Freshly baked sourdough bread", "tags": ["bakery", "bread", "fresh"], "available": True, "image": "/images/products/fresh-bread.jpg"},
        ]
    },
    "tech-hub-electronics": {
        "id": "tech-hub-electronics",
        "name": "Morning Oak Cafe",
        "type": "Coffee & Snacks",
        "category": "Food & Beverage",
        "rating": 4.3,
        "reviews": 567,
        "distance": 0.4,
        "address": "130 Demo Market St, Atlanta, GA 30326",
        "image": "/images/products/tech-hub.jpg",
        "tags": ["coffee", "pastries", "sandwiches", "breakfast", "snacks"],
        "hours": "6:00 AM - 7:00 PM",
        "offers": [
            {"title": "5% cashback on cards", "code": "CASH5"},
            {"title": "Free delivery above $25", "code": "FREEDEL"}
        ],
        "loyalty": {"points_per_dollar": 1, "reward": "$10 voucher after 100 points"},
        "catalog": [
            {"id": "th-1", "name": "Morning Brew Coffee", "price": 4.50, "category": "Drinks", "description": "Freshly brewed house blend coffee", "tags": ["coffee", "hot", "morning"], "available": True, "image": "/images/products/cold-brew.jpg"},
            {"id": "th-2", "name": "Turkey Club Sandwich", "price": 9.99, "category": "Sandwiches", "description": "Turkey, bacon, lettuce, tomato on sourdough", "tags": ["sandwich", "turkey", "lunch"], "available": True, "image": "/images/products/avocado-sandwich.jpg"},
            {"id": "th-3", "name": "Cinnamon Roll", "price": 4.75, "category": "Pastries", "description": "Warm cinnamon roll with cream cheese icing", "tags": ["pastry", "cinnamon", "sweet"], "available": True, "image": "/images/products/croissant.jpg"},
        ]
    },
    "daily-fresh-mart": {
        "id": "daily-fresh-mart",
        "name": "Daily Fresh Roasters",
        "type": "Coffee Shop",
        "category": "Food & Beverage",
        "rating": 4.6,
        "reviews": 892,
        "distance": 0.6,
        "address": "140 Demo Market St, Atlanta, GA 30326",
        "image": "/images/products/daily-fresh-mart.jpg",
        "tags": ["coffee", "tea", "espresso", "organic", "roasts"],
        "hours": "5:30 AM - 8:00 PM",
        "offers": [
            {"title": "Free delivery on all orders", "code": "FREEDEL"},
            {"title": "10% off on first order", "code": "FIRST10"}
        ],
        "loyalty": {"points_per_dollar": 2, "reward": "Free drink after 50 points"},
        "catalog": [
            {"id": "df-1", "name": "Major Dickason's Blend", "price": 5.25, "category": "Drinks", "description": "Rich, smooth, and complex dark roast coffee", "tags": ["coffee", "dark roast", "signature"], "available": True, "image": "/images/products/cold-brew.jpg"},
            {"id": "df-2", "name": "Caffe Latte", "price": 5.75, "category": "Drinks", "description": "Espresso with steamed milk", "tags": ["coffee", "latte", "espresso"], "available": True, "image": "/images/products/latte.jpg"},
            {"id": "df-3", "name": "Chai Tea Latte", "price": 5.50, "category": "Drinks", "description": "Spiced black tea with steamed milk", "tags": ["tea", "chai", "latte"], "available": True, "image": "/images/products/tea.jpg"},
            {"id": "df-4", "name": "Iced Mocha", "price": 6.25, "category": "Drinks", "description": "Espresso, chocolate, milk over ice", "tags": ["coffee", "mocha", "iced"], "available": True, "image": "/images/products/mocha.jpg"},
            {"id": "df-5", "name": "Blueberry Scone", "price": 3.95, "category": "Bakery", "description": "Fresh baked scone with blueberries", "tags": ["bakery", "scone", "blueberry"], "available": True, "image": "/images/products/blueberry-muffin.jpg"},
            {"id": "df-6", "name": "Everything Bagel", "price": 4.50, "category": "Bakery", "description": "Toasted everything bagel with cream cheese", "tags": ["bakery", "bagel", "breakfast"], "available": True, "image": "/images/products/bagel.jpg"},
            {"id": "df-7", "name": "Green Tea", "price": 3.75, "category": "Drinks", "description": "Premium Japanese green tea", "tags": ["tea", "green", "healthy"], "available": True, "image": "/images/products/tea.jpg"},
            {"id": "df-8", "name": "Cold Brew", "price": 5.50, "category": "Drinks", "description": "Slow-steeped for smooth, bold flavor", "tags": ["coffee", "cold brew", "iced"], "available": True, "image": "/images/products/cold-brew.jpg"},
            {"id": "df-9", "name": "Almond Biscotti", "price": 3.25, "category": "Bakery", "description": "Crunchy Italian almond cookie", "tags": ["bakery", "biscotti", "almond"], "available": True, "image": "/images/products/cookies.jpg"},
            {"id": "df-10", "name": "Flat White", "price": 5.50, "category": "Drinks", "description": "Double ristretto with velvety steamed milk", "tags": ["coffee", "flat white", "espresso"], "available": True, "image": "/images/products/cappuccino.jpg"},
        ]
    },
    "spice-kitchen": {
        "id": "spice-kitchen",
        "name": "Spice Kitchen",
        "type": "Indian Restaurant",
        "category": "Food & Beverage",
        "rating": 4.6,
        "reviews": 723,
        "distance": 0.8,
        "address": "150 Demo Market St, Atlanta, GA 30326",
        "image": "/images/products/curry.jpg",
        "tags": ["indian", "biryani", "curry", "lunch", "dinner", "spicy"],
        "hours": "11:00 AM - 11:00 PM",
        "offers": [
            {"title": "20% off on Biryani combos", "code": "BIRYANI20"},
            {"title": "Free dessert with orders above $15", "code": "FREEDESSERT"}
        ],
        "loyalty": {"points_per_dollar": 2, "reward": "Free biryani after 50 points"},
        "catalog": [
            {"id": "sk-1", "name": "Chicken Biryani", "price": 14.99, "category": "Biryani", "description": "Fragrant basmati rice with tender chicken pieces", "tags": ["biryani", "chicken", "rice"], "available": True, "image": "/images/products/chicken-biryani.jpg"},
            {"id": "sk-2", "name": "Veg Biryani", "price": 12.99, "category": "Biryani", "description": "Aromatic rice with mixed vegetables", "tags": ["biryani", "vegetarian", "rice"], "available": True, "image": "/images/products/veg-biryani.jpg"},
            {"id": "sk-3", "name": "Hyderabadi Biryani", "price": 15.99, "category": "Biryani", "description": "Authentic Hyderabadi style dum biryani", "tags": ["biryani", "hyderabadi", "special"], "available": True, "image": "/images/products/biryani.jpg"},
            {"id": "sk-4", "name": "Paneer Butter Masala", "price": 13.50, "category": "Curry", "description": "Rich tomato gravy with soft paneer cubes", "tags": ["curry", "paneer", "vegetarian"], "available": True, "image": "/images/products/paneer-butter-masala.jpg"},
            {"id": "sk-5", "name": "Butter Naan", "price": 3.50, "category": "Bread", "description": "Soft tandoori naan with butter", "tags": ["bread", "naan", "tandoor"], "available": True, "image": "/images/products/naan.jpg"},
            {"id": "sk-6", "name": "Chicken Tikka", "price": 12.99, "category": "Appetizer", "description": "Spiced grilled chicken pieces", "tags": ["chicken", "tikka", "appetizer"], "available": True, "image": "/images/products/tikka.jpg"},
            {"id": "sk-7", "name": "Seekh Kebab", "price": 11.99, "category": "Appetizer", "description": "Minced meat skewers grilled to perfection", "tags": ["kebab", "meat", "appetizer"], "available": True, "image": "/images/products/kebab.jpg"},
            {"id": "sk-8", "name": "Samosa (2 pcs)", "price": 5.99, "category": "Snacks", "description": "Crispy pastry with spiced potato filling", "tags": ["snacks", "samosa", "vegetarian"], "available": True, "image": "/images/products/samosa.jpg"},
            {"id": "sk-9", "name": "Mango Lassi", "price": 4.99, "category": "Beverages", "description": "Creamy yogurt drink with mango", "tags": ["lassi", "mango", "beverage"], "available": True, "image": "/images/products/mango-lassi.jpg"},
            {"id": "sk-10", "name": "Curry Combo", "price": 16.99, "category": "Combo", "description": "Dal, sabzi, rice, roti, and salad", "tags": ["combo", "curry", "meal"], "available": True, "image": "/images/products/curry.jpg"},
        ]
    },
    "south-delight": {
        "id": "south-delight",
        "name": "South Delight",
        "type": "South Indian Restaurant",
        "category": "Food & Beverage",
        "rating": 4.7,
        "reviews": 567,
        "distance": 0.7,
        "address": "160 Demo Market St, Atlanta, GA 30326",
        "image": "/images/products/dosa.jpg",
        "tags": ["south indian", "dosa", "idli", "breakfast", "vegetarian"],
        "hours": "6:00 AM - 10:00 PM",
        "offers": [
            {"title": "Breakfast combo at $7.99", "code": "BFAST799"},
            {"title": "Filter coffee free with meals", "code": "FREECOFFEE"}
        ],
        "loyalty": {"points_per_dollar": 2, "reward": "Free dosa after 40 points"},
        "catalog": [
            {"id": "sd-1", "name": "Masala Dosa", "price": 9.99, "category": "Dosa", "description": "Crispy dosa with spiced potato filling", "tags": ["dosa", "masala", "breakfast"], "available": True, "image": "/images/products/dosa.jpg"},
            {"id": "sd-2", "name": "Idli Sambar (3 pcs)", "price": 7.99, "category": "Breakfast", "description": "Soft steamed idlis with sambar", "tags": ["idli", "sambar", "breakfast"], "available": True, "image": "/images/products/idli-sambar.jpg"},
            {"id": "sd-3", "name": "Filter Coffee", "price": 3.50, "category": "Beverages", "description": "Traditional South Indian filter coffee", "tags": ["coffee", "filter", "beverage"], "available": True, "image": "/images/products/coffee-beans.jpg"},
            {"id": "sd-4", "name": "Healthy Bowl", "price": 11.50, "category": "Bowls", "description": "Rice bowl with veggies and dal", "tags": ["bowl", "healthy", "rice"], "available": True, "image": "/images/products/healthy-bowl.jpg"},
            {"id": "sd-5", "name": "Veg Wrap", "price": 8.99, "category": "Wraps", "description": "Fresh veggies wrapped in roti", "tags": ["wrap", "vegetarian", "healthy"], "available": True, "image": "/images/products/wrap.jpg"},
            {"id": "sd-6", "name": "Salmon Fillet", "price": 18.99, "category": "Seafood", "description": "Grilled salmon with herbs", "tags": ["salmon", "seafood", "healthy"], "available": True, "image": "/images/products/salmon.jpg"},
        ]
    },
    "sweet-treats-bakery": {
        "id": "sweet-treats-bakery",
        "name": "Sweet Treats Bakery",
        "type": "Bakery",
        "category": "Food & Beverage",
        "rating": 4.8,
        "reviews": 412,
        "distance": 0.9,
        "address": "170 Demo Market St, Atlanta, GA 30326",
        "image": "/images/products/cake.jpg",
        "tags": ["bakery", "cakes", "pastries", "desserts", "birthday"],
        "hours": "8:00 AM - 9:00 PM",
        "offers": [
            {"title": "15% off on birthday cakes", "code": "BDAY15"},
            {"title": "Buy 2 Get 1 on pastries", "code": "B2G1"}
        ],
        "loyalty": {"points_per_dollar": 3, "reward": "Free cupcake after 25 points"},
        "catalog": [
            {"id": "st-1", "name": "Chocolate Cake", "price": 32.00, "category": "Cakes", "description": "Rich Belgian chocolate layer cake", "tags": ["cake", "chocolate", "birthday"], "available": True, "image": "/images/products/chocolate-cake.jpg"},
            {"id": "st-2", "name": "Vanilla Cake", "price": 28.00, "category": "Cakes", "description": "Classic vanilla sponge cake", "tags": ["cake", "vanilla", "birthday"], "available": True, "image": "/images/products/cake.jpg"},
            {"id": "st-3", "name": "Donuts Box (6 pcs)", "price": 12.99, "category": "Pastries", "description": "Assorted glazed donuts", "tags": ["donuts", "pastry", "dessert"], "available": True, "image": "/images/products/donuts.jpg"},
            {"id": "st-4", "name": "Chocolate Croissant", "price": 4.50, "category": "Pastries", "description": "Flaky croissant with chocolate filling", "tags": ["croissant", "chocolate", "pastry"], "available": True, "image": "/images/products/croissant.jpg"},
            {"id": "st-5", "name": "Mango Smoothie", "price": 6.99, "category": "Beverages", "description": "Fresh mango blended with yogurt", "tags": ["smoothie", "mango", "fresh"], "available": True, "image": "/images/products/mango-smoothie.jpg"},
            {"id": "st-6", "name": "Sandwich Platter", "price": 15.99, "category": "Savory", "description": "Assorted tea sandwiches", "tags": ["sandwich", "savory", "party"], "available": True, "image": "/images/products/sandwich.jpg"},
            {"id": "st-7", "name": "Veggie Plate", "price": 10.99, "category": "Healthy", "description": "Fresh cut vegetables with hummus", "tags": ["vegetables", "healthy", "snack"], "available": True, "image": "/images/products/veggie-plate.jpg"},
        ]
    },
}
