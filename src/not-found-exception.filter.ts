// // not-found-exception.filter.ts
// import { ExceptionFilter, Catch, NotFoundException, ArgumentsHost } from '@nestjs/common';
// import { Response } from 'express';

// @Catch(NotFoundException)
// export class NotFoundExceptionFilter implements ExceptionFilter {
//   catch(exception: NotFoundException, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();

//     response.status(404).json({
//       statusCode: 404,
//       error: 'Not Found',
//       message: 'Resource not found',
//     });
//   }
// }
