ARG BUILD_FROM
FROM $BUILD_FROM

# Install the existing web server plus the small read-only WS bridge runtime.
RUN apk add --no-cache nginx net-tools iproute2 wget curl jq nodejs npm

COPY package.json package-lock.json /opt/read-boundary/
RUN cd /opt/read-boundary && npm ci --omit=dev --ignore-scripts

# Create necessary directories and fix permissions
RUN mkdir -p /var/lib/nginx/tmp /var/log/nginx /run/nginx \
    && chown -R nginx:nginx /var/lib/nginx /var/log/nginx /run/nginx \
    && chmod -R 755 /var/lib/nginx /var/log/nginx /run/nginx

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Cache bust v3.9.3
RUN echo "v3.9.3" > /tmp/build-version

# Copy the built React app
COPY build /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

COPY read-boundary.js /read-boundary.js

# Expose port
EXPOSE 8099

CMD ["/run.sh"]
