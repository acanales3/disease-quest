interface Instructor {
  id: number;
  name: string;
  email: string;
  school: string;
  classroom: number;
  status: "active" | "deactived";
  // action column still needed
}

export const instructor: Instructor[] = [
  {
    id: 0,
    name: "Dr. Nath",
    email: "nath@tcu.edu",
    school: "Texas Christian University",
    classroom: 0,
    status: "active",
  },
  {
    id: 1,
    name: "Professor 1",
    email: "prof1@university.edu",
    school: "University of Metro",
    classroom: 101,
    status: "active",
  },
  {
    id: 2,
    name: "Professor 2",
    email: "prof2@college.edu",
    school: "Riverbend College",
    classroom: 202,
    status: "active",
  },
  {
    id: 3,
    name: "Professor 3",
    email: "prof3@institute.edu",
    school: "Northpoint Institute",
    classroom: 303,
    status: "deactived",
  },
  {
    id: 4,
    name: "Professor 4",
    email: "prof4@academy.edu",
    school: "Lakeside Academy",
    classroom: 404,
    status: "active",
  },
  {
    id: 5,
    name: "Professor 5",
    email: "prof5@state.edu",
    school: "State Tech University",
    classroom: 505,
    status: "active",
  },
  {
    id: 6,
    name: "Professor 6",
    email: "prof6@poly.edu",
    school: "Polytechnic College",
    classroom: 606,
    status: "deactived",
  },
  {
    id: 7,
    name: "Professor 7",
    email: "prof7@edu.org",
    school: "Eastern University",
    classroom: 707,
    status: "active",
  },
  {
    id: 8,
    name: "Professor 8",
    email: "prof8@uni.edu",
    school: "Central University",
    classroom: 808,
    status: "active",
  },
  {
    id: 9,
    name: "Professor 9",
    email: "prof9@school.edu",
    school: "Valley School of Science",
    classroom: 909,
    status: "active",
  },
];
