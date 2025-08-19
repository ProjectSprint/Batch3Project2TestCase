export type User = {
  // preferences?: string | null;
  // weightUnit?: string | null;
  // heightUnit?: string | null;
  // weight?: string | null;
  // height?: string | null;
  // imageUri?: string | null;
  email: string;
  password: string;
  token: string;
};

export enum ActivityType {
  Walking = 'Walking',
  Yoga = 'Yoga',
  Stretching = 'Stretching',
  Cycling = 'Cycling',
  Swimming = 'Swimming',
  Dancing = 'Dancing',
  Hiking = 'Hiking',
  Running = 'Running',
  HIIT = 'HIIT',
  JumpRope = 'JumpRope'
}

// Update the Activity type to use the enum
export type Activity = {
  activityId: string;
  activityType: ActivityType;
  doneAt: Date;
  durationInMinutes: number;
  caloriesBurned: number;
  createdAt: Date;
}
