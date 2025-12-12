#!/bin/sh

set -e

apt-get update -y && apt-get install -y openssl

echo "installing dependencies..."
npm install

echo "generating prisma client..."
npx prisma db pull
npx prisma generate

echo "initializing server..."
npm start

echo "server initialized in the port 3001"
