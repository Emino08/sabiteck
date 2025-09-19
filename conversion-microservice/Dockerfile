FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    zip \
    unzip \
    git \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    libxml2-dev \
    ghostscript \
    imagemagick \
    imagemagick-dev \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-fra \
    tesseract-ocr-data-deu \
    tesseract-ocr-data-spa \
    poppler-utils \
    libreoffice \
    clamav \
    clamav-daemon \
    supervisor

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        gd \
        zip \
        intl \
        mbstring \
        xml \
        opcache \
        pcntl \
        posix \
        sockets

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install ImageMagick extension
RUN pecl install imagick && docker-php-ext-enable imagick

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy application code
COPY . .

# Set permissions
RUN chown -R www-data:www-data /app \
    && chmod -R 755 /app \
    && mkdir -p /app/storage /app/temp /app/logs \
    && chown -R www-data:www-data /app/storage /app/temp /app/logs \
    && chmod -R 777 /app/storage /app/temp /app/logs

# Configure PHP
RUN echo "upload_max_filesize = 100M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 100M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 512M" >> /usr/local/etc/php/conf.d/uploads.ini

# Configure OPcache
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.enable_cli=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.interned_strings_buffer=16" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.revalidate_freq=2" >> /usr/local/etc/php/conf.d/opcache.ini

# Configure ClamAV
RUN freshclam || true

# Create supervisor configuration
RUN echo "[supervisord]" > /etc/supervisord.conf \
    && echo "nodaemon=true" >> /etc/supervisord.conf \
    && echo "user=root" >> /etc/supervisord.conf \
    && echo "" >> /etc/supervisord.conf \
    && echo "[program:php-fpm]" >> /etc/supervisord.conf \
    && echo "command=php-fpm" >> /etc/supervisord.conf \
    && echo "autostart=true" >> /etc/supervisord.conf \
    && echo "autorestart=true" >> /etc/supervisord.conf \
    && echo "user=root" >> /etc/supervisord.conf \
    && echo "" >> /etc/supervisord.conf \
    && echo "[program:app]" >> /etc/supervisord.conf \
    && echo "command=php -S 0.0.0.0:8080 -t public" >> /etc/supervisord.conf \
    && echo "directory=/app" >> /etc/supervisord.conf \
    && echo "autostart=true" >> /etc/supervisord.conf \
    && echo "autorestart=true" >> /etc/supervisord.conf \
    && echo "user=www-data" >> /etc/supervisord.conf

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]