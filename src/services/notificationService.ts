export interface NotificationWashingStatus {
    type: string;
    action: ActionType;
}

export enum ActionType {
    PREPAIRING = 'PREPAIRING',
    WASHING = 'WASHING',
    DONE = 'DONE',
    ERROR = 'ERROR'
}   