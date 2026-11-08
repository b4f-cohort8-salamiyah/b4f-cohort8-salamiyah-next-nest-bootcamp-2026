import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Pre-Session-23 integration setup: the real Next.js frontend runs on its own real origin
  // (http://localhost:3001 in development) -- without this, every real browser request from it
  // would be blocked by the browser's own same-origin policy, never reaching this API at all.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('B4F Board API')
    .setDescription(
      'B4F Board: Users, Workspaces, Projects, Issues, Comments/@mentions, Activity History, and Notifications, backed by PostgreSQL/Prisma.',
    )
    .addBearerAuth()
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
