export interface AppNotification {
  id: string;
  type: "exam" | "result" | "class" | "system" | "submission";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  linkTo: string;
}
