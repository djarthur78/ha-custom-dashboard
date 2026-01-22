ARG BUILD_FROM
FROM $BUILD_FROM

# Install nginx
RUN apk add --no-cache nginx

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built React app
COPY build /usr/share/nginx/html

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

# Expose port
EXPOSE 8099

CMD ["/run.sh"]
