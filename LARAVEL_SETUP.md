# Laravel API Setup Guide

## Making Endpoints Public (For Testing)

To make the API endpoints accessible without authentication, you need to modify your Laravel routes file.

### Step 1: Locate Your API Routes File

The API routes are typically in: `routes/api.php`

### Step 2: Make Endpoints Public

Find the routes that are protected with `auth:sanctum` middleware and temporarily remove the middleware for testing.

#### Option A: Remove Middleware from Specific Routes

**Before (Protected):**
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/recipes/search', [RecipeController::class, 'search']);
    Route::get('/recipes/{id}', [RecipeController::class, 'show']);
    Route::get('/ingredients', [IngredientController::class, 'index']);
    Route::get('/ingredients/search', [IngredientController::class, 'search']);
    Route::get('/allergies', [AllergyController::class, 'index']);
});
```

**After (Public for Testing):**
```php
// Public routes for testing (remove auth:sanctum middleware)
Route::get('/recipes/search', [RecipeController::class, 'search']);
Route::get('/recipes/{id}', [RecipeController::class, 'show']);
Route::get('/ingredients', [IngredientController::class, 'index']);
Route::get('/ingredients/search', [IngredientController::class, 'search']);
Route::get('/allergies', [AllergyController::class, 'index']);

// Keep protected routes separate
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/recipes/save', [RecipeController::class, 'save']);
    Route::post('/recipes/{recipeId}/favorite', [RecipeController::class, 'favorite']);
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::get('/my-recipes', [RecipeController::class, 'myRecipes']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);
    Route::post('/ingredients', [IngredientController::class, 'store']);
    Route::delete('/ingredients/{id}', [IngredientController::class, 'destroy']);
    Route::post('/allergies', [AllergyController::class, 'store']);
    Route::delete('/allergies/{id}', [AllergyController::class, 'destroy']);
});
```

#### Option B: Create a Separate Public Group

```php
// Public routes (no authentication required)
Route::prefix('public')->group(function () {
    Route::get('/recipes/search', [RecipeController::class, 'search']);
    Route::get('/recipes/{id}', [RecipeController::class, 'show']);
    Route::get('/ingredients', [IngredientController::class, 'index']);
    Route::get('/ingredients/search', [IngredientController::class, 'search']);
    Route::get('/allergies', [AllergyController::class, 'index']);
});

// Protected routes (authentication required)
Route::middleware('auth:sanctum')->group(function () {
    // ... protected routes
});
```

**Note:** If you use Option B, you'll need to update the mobile app endpoints to include `/public` prefix, or remove the prefix in Laravel.

### Step 3: Verify CORS Configuration

Make sure CORS is properly configured in `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['*'], // Or specify your app's origin
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => false,
```

### Step 4: Test the Endpoints

After making changes, test the endpoints:

```bash
# Test recipes endpoint
curl http://127.0.0.1:8000/api/recipes/search

# Test ingredients endpoint
curl http://127.0.0.1:8000/api/ingredients

# Test with query parameters
curl "http://127.0.0.1:8000/api/recipes/search?ingredients[]=chicken"
```

### Step 5: Restart Laravel Server

After making changes, restart your Laravel server:

```bash
php artisan serve
```

## Security Note

⚠️ **Important:** Making endpoints public is only for testing purposes. In production, you should:
1. Keep authentication enabled
2. Implement proper authentication in the mobile app
3. Use API rate limiting
4. Validate and sanitize all inputs

## Next Steps

Once endpoints are public, your mobile app should be able to fetch data. After testing, you can:
1. Implement login/register functionality in the mobile app
2. Store authentication tokens securely
3. Re-enable authentication middleware in Laravel
4. Send authentication tokens with API requests
