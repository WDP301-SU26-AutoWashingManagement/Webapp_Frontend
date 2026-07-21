export interface NotificationWashingStatus {
    type: string;
    action: ActionType;
}

export enum ActionType {
    IDLE = 'IDLE',
    PRE_RINSE = 'PRE RINSE',
    SCRUBBING = 'SCRUBBING',
    POST_RINSE = 'POST RINSE',
    DRYING = 'DRYING',
    DONE = 'DONE',
    ERROR = 'ERROR'
}   