import { z } from 'zod';
import { 
  insertLeadSchema, leads,
  insertStudentSchema, students,
  insertTeacherSchema, teachers,
  insertCourseSchema, courses,
  insertEnrollmentSchema, enrollments,
  insertFeeSchema, fees
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  leads: {
    list: { method: 'GET' as const, path: '/api/leads' as const, responses: { 200: z.array(z.custom<typeof leads.$inferSelect>()) } },
    create: { method: 'POST' as const, path: '/api/leads' as const, input: insertLeadSchema, responses: { 201: z.custom<typeof leads.$inferSelect>(), 400: errorSchemas.validation } },
    update: { method: 'PUT' as const, path: '/api/leads/:id' as const, input: insertLeadSchema.partial(), responses: { 200: z.custom<typeof leads.$inferSelect>(), 400: errorSchemas.validation, 404: errorSchemas.notFound } },
    delete: { method: 'DELETE' as const, path: '/api/leads/:id' as const, responses: { 204: z.void(), 404: errorSchemas.notFound } },
  },
  students: {
    list: { method: 'GET' as const, path: '/api/students' as const, responses: { 200: z.array(z.custom<typeof students.$inferSelect>()) } },
    get: { method: 'GET' as const, path: '/api/students/:id' as const, responses: { 200: z.custom<typeof students.$inferSelect>(), 404: errorSchemas.notFound } },
    create: { method: 'POST' as const, path: '/api/students' as const, input: insertStudentSchema, responses: { 201: z.custom<typeof students.$inferSelect>(), 400: errorSchemas.validation } },
    update: { method: 'PUT' as const, path: '/api/students/:id' as const, input: insertStudentSchema.partial(), responses: { 200: z.custom<typeof students.$inferSelect>(), 400: errorSchemas.validation, 404: errorSchemas.notFound } },
    delete: { method: 'DELETE' as const, path: '/api/students/:id' as const, responses: { 204: z.void(), 404: errorSchemas.notFound } },
  },
  teachers: {
    list: { method: 'GET' as const, path: '/api/teachers' as const, responses: { 200: z.array(z.custom<typeof teachers.$inferSelect>()) } },
    create: { method: 'POST' as const, path: '/api/teachers' as const, input: insertTeacherSchema, responses: { 201: z.custom<typeof teachers.$inferSelect>(), 400: errorSchemas.validation } },
    update: { method: 'PUT' as const, path: '/api/teachers/:id' as const, input: insertTeacherSchema.partial(), responses: { 200: z.custom<typeof teachers.$inferSelect>(), 400: errorSchemas.validation, 404: errorSchemas.notFound } },
    delete: { method: 'DELETE' as const, path: '/api/teachers/:id' as const, responses: { 204: z.void(), 404: errorSchemas.notFound } },
  },
  courses: {
    list: { method: 'GET' as const, path: '/api/courses' as const, responses: { 200: z.array(z.custom<typeof courses.$inferSelect>()) } },
    create: { method: 'POST' as const, path: '/api/courses' as const, input: insertCourseSchema, responses: { 201: z.custom<typeof courses.$inferSelect>(), 400: errorSchemas.validation } },
    update: { method: 'PUT' as const, path: '/api/courses/:id' as const, input: insertCourseSchema.partial(), responses: { 200: z.custom<typeof courses.$inferSelect>(), 400: errorSchemas.validation, 404: errorSchemas.notFound } },
    delete: { method: 'DELETE' as const, path: '/api/courses/:id' as const, responses: { 204: z.void(), 404: errorSchemas.notFound } },
  },
  enrollments: {
    list: { method: 'GET' as const, path: '/api/enrollments' as const, responses: { 200: z.array(z.custom<typeof enrollments.$inferSelect>()) } },
    create: { method: 'POST' as const, path: '/api/enrollments' as const, input: insertEnrollmentSchema, responses: { 201: z.custom<typeof enrollments.$inferSelect>(), 400: errorSchemas.validation } },
    delete: { method: 'DELETE' as const, path: '/api/enrollments/:id' as const, responses: { 204: z.void(), 404: errorSchemas.notFound } },
  },
  fees: {
    list: { method: 'GET' as const, path: '/api/fees' as const, responses: { 200: z.array(z.custom<typeof fees.$inferSelect>()) } },
    create: { method: 'POST' as const, path: '/api/fees' as const, input: insertFeeSchema, responses: { 201: z.custom<typeof fees.$inferSelect>(), 400: errorSchemas.validation } },
    delete: { method: 'DELETE' as const, path: '/api/fees/:id' as const, responses: { 204: z.void(), 404: errorSchemas.notFound } },
  },
  dashboard: {
    stats: { 
      method: 'GET' as const, 
      path: '/api/dashboard/stats' as const, 
      responses: { 
        200: z.object({
          totalStudents: z.number(),
          activeLeads: z.number(),
          totalTeachers: z.number(),
          totalRevenue: z.number(),
          recentLeads: z.array(z.custom<typeof leads.$inferSelect>()),
        }) 
      } 
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
