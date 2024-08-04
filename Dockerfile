# Use official Node.js image
FROM node:18

# Create and set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY src/ .

# Expose port
EXPOSE 3000

# Start the application
CMD [ "node", "app.js" ]
