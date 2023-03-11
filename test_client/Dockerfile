# Use the official Dart image.
# https://hub.docker.com/r/google/dart-runtime
FROM google/dart-runtime AS build

# Set the working directory.
WORKDIR /app

# Copy the pubspec file and get the dependencies.
COPY pubspec.* /app/
RUN dart pub get

# Copy the lib directory.
COPY lib/ /app/bin/

# Run the tests.
CMD ["dart", "test"]