export interface ThingSettings {
    thing_id: string;
    model_id: number;
    resources: string[];
    settings: Record<string, string>;
    status: number;
    thing_token: string;
  }