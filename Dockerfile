# Imagen base de Node.js
FROM node

# Establece el directorio de trabajo en /app
WORKDIR /loadBalancer

# Copia los archivos necesarios
COPY package*.json ./
COPY . .

# Instala las dependencias
RUN npm install

# Expone el puerto en el que la aplicación va a ejecutarse
EXPOSE $PORT_BALANCER

# Comando para ejecutar la aplicación
CMD ["node", "LoadBalancer.js"]