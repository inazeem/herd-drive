<?php

use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\ShareableLinksController;
use Common\Core\Controllers\HomeController;
use Common\Pages\CustomPageController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;

//FRONT-END ROUTES THAT NEED TO BE PRE-RENDERED
Route::get('/', LandingPageController::class);
Route::get('drive/s/{hash}', [ShareableLinksController::class, 'show']);

Route::get('contact', [HomeController::class, 'render']);
Route::get('pages/{slugOrId}', [CustomPageController::class, 'show']);
Route::get('login', [HomeController::class, 'render'])->name('login');
Route::get('register', [HomeController::class, 'render'])->name('register');
Route::get('forgot-password', [HomeController::class, 'render']);
Route::get('pricing', '\Common\Billing\PricingPageController');

//CATCH ALL ROUTES AND REDIRECT TO HOME
Route::fallback([HomeController::class, 'render']);

if (app()->environment('local', 'development')) {
    Route::any('/@vite/{path?}', function ($path = '') {
        $response = Http::get("http://127.0.0.1:5173/@vite/{$path}");
        return $response->body();
    })->where('path', '.*');
    
    Route::any('/resources/{path?}', function ($path = '') {
        $response = Http::get("http://127.0.0.1:5173/resources/{$path}");
        return $response->body();
    })->where('path', '.*');
}
