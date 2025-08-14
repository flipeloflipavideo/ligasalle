const fs = require('fs');
const path = require('path');

// Función para cambiar el esquema de Prisma según el entorno
function setupPrismaSchema() {
  const env = process.env.NODE_ENV || 'development';
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const postgresqlPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');
  const sqlitePath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');

  console.log(`🔧 Setting up Prisma schema for ${env} environment...`);

  if (env === 'production') {
    // En producción, usar el esquema PostgreSQL
    if (fs.existsSync(postgresqlPath)) {
      fs.copyFileSync(postgresqlPath, schemaPath);
      console.log('✅ Using PostgreSQL schema for production');
    } else {
      console.error('❌ PostgreSQL schema not found!');
      process.exit(1);
    }
  } else {
    // En desarrollo, usar el esquema SQLite
    if (fs.existsSync(sqlitePath)) {
      fs.copyFileSync(sqlitePath, schemaPath);
      console.log('✅ Using SQLite schema for development');
    } else {
      console.error('❌ SQLite schema not found!');
      process.exit(1);
    }
  }
}

// Ejecutar la configuración
setupPrismaSchema();