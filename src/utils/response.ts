import { Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    pagination?: PaginationMeta;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export const successResponse = <T>(res: Response, data: T, statusCode: number = 200, message?: string) => {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };

    if (message) {
        response.message = message;
    }

    return res.status(statusCode).json(response);
};

export const errorResponse = (res: Response, error: string, statusCode: number = 500) => {
    const response: ApiResponse = {
        success: false,
        error,
    };

    return res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    statusCode: number = 200
) => {
    const response: ApiResponse<T[]> = {
        success: true,
        data,
        pagination,
    };

    return res.status(statusCode).json(response);
};

export const calculatePagination = (page: number, limit: number, total: number): PaginationMeta => {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
};
