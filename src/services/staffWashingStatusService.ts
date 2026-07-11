import apiClient from "./apiClient"

export interface PlateInput {
    plate: string
}

export interface WashResponse {
    success: boolean
    message: string
    data: any
}

export const washService = {
    /**
     * Gửi yêu cầu rửa xe
     */
    async wash(plate: PlateInput): Promise<WashResponse> {
        return await apiClient.post<WashResponse>('/wash/manual', plate)
    },

    async stop() {
        return await apiClient.post<WashResponse>('/wash/stop')
    },
}