import {
  User,
  Tribe,
  TribeMembership,
  ScheduleEntry,
  Destination,
  RideMatch,
  TrustLevel,
  TribeMembershipStatus,
  RecurrencePattern,
  ScheduleEntryStatus,
  RideMatchStatus,
} from "@/types";

// Helper to generate unique IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Mock Users (beyond the current user)
const mockOtherUsers: User[] = [
  {
    id: generateId("user"),
    name: "Sarah Johnson",
    phoneNumber: "555-111-2222",
    email: "sarah.j@example.com",
    created_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    last_modified_date: new Date().toISOString(),
    notification_preferences: { push: true, email: true, sms: true },
    location_address: "123 Oak Ave, Anytown, USA",
  },
  {
    id: generateId("user"),
    name: "David Lee",
    phoneNumber: "555-333-4444",
    email: "david.l@example.com",
    created_date: new Date(Date.now() - 86400000 * 60).toISOString(),
    last_modified_date: new Date().toISOString(),
    notification_preferences: { push: false, email: true, sms: false },
    location_address: "456 Pine St, Anytown, USA",
  },
  {
    id: generateId("user"),
    name: "Emily Chen",
    phoneNumber: "555-555-6666",
    email: "emily.c@example.com",
    created_date: new Date(Date.now() - 86400000 * 15).toISOString(),
    last_modified_date: new Date().toISOString(),
    notification_preferences: { push: true, email: false, sms: true },
    location_address: "789 Maple Rd, Anytown, USA",
  },
];

export const getMockTribeData = (currentUser: User | null): Tribe[] => {
  if (!currentUser) return [];

  const tribeId1 = generateId("tribe");
  const tribeId2 = generateId("tribe");

  return [
    {
      id: tribeId1,
      owner_id: currentUser.id,
      name: "Soccer Parents Tribe",
      created_date: new Date(Date.now() - 86400000 * 10).toISOString(),
      last_modified_date: new Date().toISOString(),
      member_count: 3,
    },
    {
      id: tribeId2,
      owner_id: currentUser.id,
      name: "School Carpool Crew",
      created_date: new Date(Date.now() - 86400000 * 5).toISOString(),
      last_modified_date: new Date().toISOString(),
      member_count: 2,
    },
  ];
};

export const getMockTribeMemberships = (currentUser: User | null, tribes: Tribe[]): TribeMembership[] => {
  if (!currentUser || tribes.length === 0) return [];

  const soccerTribe = tribes.find(t => t.name === "Soccer Parents Tribe");
  const schoolTribe = tribes.find(t => t.name === "School Carpool Crew");

  const memberships: TribeMembership[] = [];

  if (soccerTribe) {
    memberships.push(
      {
        id: generateId("membership"),
        tribe_id: soccerTribe.id,
        user_id: currentUser.id, // Current user is a member of their own tribe
        trust_level: "direct",
        status: "accepted",
        invited_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        accepted_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        created_date: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: generateId("membership"),
        tribe_id: soccerTribe.id,
        user_id: mockOtherUsers[0].id,
        trust_level: "direct",
        status: "accepted",
        invited_date: new Date(Date.now() - 86400000 * 9).toISOString(),
        accepted_date: new Date(Date.now() - 86400000 * 8).toISOString(),
        created_date: new Date(Date.now() - 86400000 * 9).toISOString(),
      },
      {
        id: generateId("membership"),
        tribe_id: soccerTribe.id,
        user_id: mockOtherUsers[1].id,
        trust_level: "activity-specific",
        status: "pending",
        invited_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        created_date: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    );
  }

  if (schoolTribe) {
    memberships.push(
      {
        id: generateId("membership"),
        tribe_id: schoolTribe.id,
        user_id: currentUser.id,
        trust_level: "direct",
        status: "accepted",
        invited_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        accepted_date: new Date(Date.now() - 86400000 * 5).toISOString(),
        created_date: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: generateId("membership"),
        tribe_id: schoolTribe.id,
        user_id: mockOtherUsers[2].id,
        trust_level: "direct",
        status: "accepted",
        invited_date: new Date(Date.now() - 86400000 * 4).toISOString(),
        accepted_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        created_date: new Date(Date.now() - 86400000 * 4).toISOString(),
      }
    );
  }

  return memberships;
};

export const getMockDestinations = (currentUser: User | null): Destination[] => {
  if (!currentUser) return [];

  return [
    {
      id: generateId("dest"),
      name: "Central Elementary School",
      address: "100 School Rd, Anytown, USA",
      google_place_id: "mock_place_id_1",
      latitude: 34.052235,
      longitude: -118.243683,
      category: "School",
      verified_date: new Date(Date.now() - 86400000 * 20).toISOString(),
      created_by: currentUser.id,
      usage_count: 15,
    },
    {
      id: generateId("dest"),
      name: "Community Soccer Fields",
      address: "200 Sports Blvd, Anytown, USA",
      google_place_id: "mock_place_id_2",
      latitude: 34.045000,
      longitude: -118.250000,
      category: "Sports",
      verified_date: new Date(Date.now() - 86400000 * 18).toISOString(),
      created_by: currentUser.id,
      usage_count: 10,
    },
    {
      id: generateId("dest"),
      name: "Dance Studio Rhythmic",
      address: "300 Art St, Anytown, USA",
      google_place_id: "mock_place_id_3",
      latitude: 34.060000,
      longitude: -118.230000,
      category: "Activity",
      verified_date: new Date(Date.now() - 86400000 * 12).toISOString(),
      created_by: mockOtherUsers[0].id,
      usage_count: 7,
    },
    {
      id: generateId("dest"),
      name: "Home - Sarah Johnson",
      address: "123 Oak Ave, Anytown, USA",
      google_place_id: "mock_place_id_4",
      latitude: 34.052235,
      longitude: -118.243683,
      category: "Home",
      verified_date: new Date(Date.now() - 86400000 * 5).toISOString(),
      created_by: mockOtherUsers[0].id,
      usage_count: 3,
    },
];
};

export const getMockScheduleEntries = (currentUser: User | null, destinations: Destination[]): ScheduleEntry[] => {
  if (!currentUser || destinations.length === 0) return [];

  const school = destinations.find(d => d.name === "Central Elementary School");
  const soccer = destinations.find(d => d.name === "Community Soccer Fields");
  const dance = destinations.find(d => d.name === "Dance Studio Rhythmic");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const entries: ScheduleEntry[] = [];

  if (school) {
    entries.push(
      {
        id: generateId("schedule"),
        user_id: currentUser.id,
        child_name: "Leo",
        destination_id: school.id,
        pickup_time: new Date(today.setHours(7, 30, 0, 0)).toISOString(),
        dropoff_time: new Date(today.setHours(8, 0, 0, 0)).toISOString(),
        recurrence_pattern: "daily",
        recurrence_details: "Mon-Fri",
        status: "active",
        created_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        last_modified_date: new Date().toISOString(),
      },
      {
        id: generateId("schedule"),
        user_id: currentUser.id,
        child_name: "Mia",
        destination_id: school.id,
        pickup_time: new Date(today.setHours(14, 30, 0, 0)).toISOString(),
        dropoff_time: new Date(today.setHours(15, 0, 0, 0)).toISOString(),
        recurrence_pattern: "daily",
        recurrence_details: "Mon-Fri",
        status: "active",
        created_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        last_modified_date: new Date().toISOString(),
      }
    );
  }

  if (soccer) {
    entries.push(
      {
        id: generateId("schedule"),
        user_id: currentUser.id,
        child_name: "Leo",
        destination_id: soccer.id,
        pickup_time: new Date(tomorrow.setHours(16, 0, 0, 0)).toISOString(),
        dropoff_time: new Date(tomorrow.setHours(16, 30, 0, 0)).toISOString(),
        recurrence_pattern: "weekly",
        recurrence_details: "Tuesday",
        status: "active",
        created_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        last_modified_date: new Date().toISOString(),
      }
    );
  }

  if (dance) {
    entries.push(
      {
        id: generateId("schedule"),
        user_id: currentUser.id,
        child_name: "Mia",
        destination_id: dance.id,
        pickup_time: new Date(nextWeek.setHours(17, 0, 0, 0)).toISOString(),
        dropoff_time: new Date(nextWeek.setHours(17, 45, 0, 0)).toISOString(),
        recurrence_pattern: "one-time",
        status: "active",
        created_date: new Date(Date.now() - 86400000 * 1).toISOString(),
        last_modified_date: new Date().toISOString(),
      }
    );
  }

  return entries;
};

export const getMockRideMatches = (currentUser: User | null, scheduleEntries: ScheduleEntry[]): RideMatch[] => {
  if (!currentUser || scheduleEntries.length === 0) return [];

  const leoSchoolPickup = scheduleEntries.find(s => s.child_name === "Leo" && s.recurrence_pattern === "daily" && s.pickup_time.includes("07:30"));
  const miaSoccer = scheduleEntries.find(s => s.child_name === "Mia" && s.recurrence_pattern === "weekly");

  const matches: RideMatch[] = [];

  if (leoSchoolPickup) {
    matches.push(
      {
        id: generateId("match"),
        requester_id: currentUser.id,
        provider_id: mockOtherUsers[0].id, // Sarah Johnson
        schedule_entry_id: leoSchoolPickup.id,
        match_score: 95,
        status: "suggested",
        suggested_date: new Date().toISOString(),
        created_date: new Date().toISOString(),
      }
    );
  }

  if (miaSoccer) {
    matches.push(
      {
        id: generateId("match"),
        requester_id: mockOtherUsers[2].id, // Emily Chen
        provider_id: currentUser.id,
        schedule_entry_id: miaSoccer.id,
        match_score: 80,
        status: "accepted",
        suggested_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        created_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        response_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      }
    );
  }

  return matches;
};

export const getMockUsers = (): User[] => {
  return mockOtherUsers;
}