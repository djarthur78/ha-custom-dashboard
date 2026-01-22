ARG BUILD_FROM
FROM $BUILD_FROM

# Install nginx
RUN apk add --no-cache nginx

# Create necessary directories and fix permissions
RUN mkdir -p /var/lib/nginx/tmp /var/log/nginx /run/nginx \
    && chown -R nginx:nginx /var/lib/nginx /var/log/nginx /run/nginx \
    && chmod -R 755 /var/lib/nginx /var/log/nginx /run/nginx

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built React app
COPY build /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

# Expose port
EXPOSE 8099

CMD ["/run.sh"]
