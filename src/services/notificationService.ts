export interface NotificationWashingStatus {
    id: number;
    action: ActionType;
}

export enum ActionType {
    PREPAIRING = 'PREPAIRING',
    WASHING = 'WASHING',
    DONE = 'DONE',
    ERROR = 'ERROR'
}   