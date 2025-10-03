import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home as HomeIcon, MapPin, DollarSign, Bed, Bath } from 'lucide-react';

const Home = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative px-8 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Dream Home
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Discover the perfect property in your favorite neighborhood. 
            Browse thousands of listings and find your ideal home.
          </p>
          <Link
            to="/properties"
            className="inline-flex items-center space-x-2 bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Search className="h-5 w-5" />
            <span>Browse Properties</span>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <div className="bg-primary-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <HomeIcon className="h-8 w-8 text-primary-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Wide Selection</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Browse through thousands of properties across different neighborhoods and price ranges.
          </p>
        </div>
        
        <div className="text-center p-6">
          <div className="bg-primary-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-primary-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Prime Locations</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Find properties in the most desirable locations with excellent amenities and connectivity.
          </p>
        </div>
        
        <div className="text-center p-6">
          <div className="bg-primary-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-primary-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Best Prices</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Get the best deals with competitive pricing and transparent transaction processes.
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Why Choose Us</h2>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary-600 dark:text-blue-400 mb-2">1000+</div>
            <div className="text-gray-600 dark:text-gray-300">Properties Listed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 dark:text-blue-400 mb-2">500+</div>
            <div className="text-gray-600 dark:text-gray-300">Happy Clients</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 dark:text-blue-400 mb-2">50+</div>
            <div className="text-gray-600 dark:text-gray-300">Cities Covered</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 dark:text-blue-400 mb-2">24/7</div>
            <div className="text-gray-600 dark:text-gray-300">Support Available</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Ready to Find Your Home?</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Join thousands of satisfied customers who found their perfect home with us.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/properties"
            className="btn-primary"
          >
            Browse Properties
          </Link>
          <Link
            to="/register"
            className="btn-secondary"
          >
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 