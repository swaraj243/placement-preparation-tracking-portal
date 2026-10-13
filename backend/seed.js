const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Company = require("./models/Company");
const Feedback = require("./models/Feedback");
const Progress = require("./models/Progress");
const User = require("./models/User");

dotenv.config();

const seed = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing. Create backend/.env before running seed.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding");

    await Promise.all([
      User.deleteMany({}),
      Progress.deleteMany({}),
      Company.deleteMany({}),
      Feedback.deleteMany({})
    ]);

    const admin = await User.create({
      name: "Placement Admin",
      email: "admin@placementportal.com",
      password: "admin123",
      role: "admin",
      department: "Placement Cell"
    });

    const students = await User.create([
      {
        name: "Ananya Sharma",
        email: "ananya@student.com",
        password: "student123",
        role: "student",
        rollNumber: "CSE2027001",
        department: "Computer Science",
        cgpa: 8.7,
        graduationYear: 2027
      },
      {
        name: "Rahul Kumar",
        email: "rahul@student.com",
        password: "student123",
        role: "student",
        rollNumber: "IT2027008",
        department: "Information Technology",
        cgpa: 8.1,
        graduationYear: 2027
      },
      {
        name: "Neha Patel",
        email: "neha@student.com",
        password: "student123",
        role: "student",
        rollNumber: "ECE2027014",
        department: "Electronics and Communication",
        cgpa: 7.9,
        graduationYear: 2027
      }
    ]);

    await Company.create([
      {
        name: "TCS Digital",
        description: "Digital engineering role focused on software development and problem solving.",
        jobRole: "Software Engineer",
        packageOffered: 7,
        minCgpa: 7,
        eligibleDepartments: ["Computer Science", "Information Technology", "Electronics and Communication"],
        requiredCodingPercentage: 80,
        requiredAptitudePercentage: 80,
        requiredInterviewPercentage: 70,
        location: "Pan India",
        applicationDeadline: new Date("2026-07-15")
      },
      {
        name: "Infosys",
        description: "Systems engineering role for application development and enterprise delivery.",
        jobRole: "Systems Engineer",
        packageOffered: 4.5,
        minCgpa: 6.5,
        eligibleDepartments: ["Computer Science", "Information Technology", "Electronics and Communication"],
        requiredCodingPercentage: 65,
        requiredAptitudePercentage: 60,
        requiredInterviewPercentage: 60,
        location: "Bengaluru",
        applicationDeadline: new Date("2026-07-20")
      },
      {
        name: "Wipro",
        description: "Project engineering role for technology consulting and software services.",
        jobRole: "Project Engineer",
        packageOffered: 4,
        minCgpa: 6,
        eligibleDepartments: ["Computer Science", "Information Technology", "Electronics and Communication", "Electrical Engineering"],
        requiredCodingPercentage: 60,
        requiredAptitudePercentage: 60,
        requiredInterviewPercentage: 55,
        location: "Hyderabad",
        applicationDeadline: new Date("2026-07-24")
      },
      {
        name: "Accenture",
        description: "Associate developer role for cloud, data, and full-stack delivery projects.",
        jobRole: "Associate Developer",
        packageOffered: 6,
        minCgpa: 6.5,
        eligibleDepartments: ["Computer Science", "Information Technology", "Artificial Intelligence", "Data Science"],
        requiredCodingPercentage: 70,
        requiredAptitudePercentage: 65,
        requiredInterviewPercentage: 65,
        location: "Pune",
        applicationDeadline: new Date("2026-07-28")
      },
      {
        name: "Cognizant",
        description: "Programmer analyst role for application support and software development.",
        jobRole: "Programmer Analyst",
        packageOffered: 5.2,
        minCgpa: 6,
        eligibleDepartments: ["Computer Science", "Information Technology", "Electronics and Communication"],
        requiredCodingPercentage: 65,
        requiredAptitudePercentage: 60,
        requiredInterviewPercentage: 60,
        location: "Chennai",
        applicationDeadline: new Date("2026-08-02")
      }
    ]);

    await Progress.create([
      {
        user: students[0]._id,
        coding: { completedTopics: 44, totalTopics: 50, notes: "Strong DSA consistency" },
        aptitude: { completedTopics: 37, totalTopics: 50, notes: "Needs faster timed practice" },
        interview: { completedTopics: 19, totalTopics: 25, notes: "Good project explanation" }
      },
      {
        user: students[1]._id,
        coding: { completedTopics: 39, totalTopics: 50, notes: "Good arrays and strings progress" },
        aptitude: { completedTopics: 41, totalTopics: 50, notes: "Strong quantitative aptitude" },
        interview: { completedTopics: 17, totalTopics: 25, notes: "Needs more HR mock practice" }
      },
      {
        user: students[2]._id,
        coding: { completedTopics: 36, totalTopics: 50, notes: "Improving dynamic programming basics" },
        aptitude: { completedTopics: 35, totalTopics: 50, notes: "Consistent weekly tests" },
        interview: { completedTopics: 21, totalTopics: 25, notes: "Strong communication and resume discussion" }
      }
    ]);

    await Feedback.create([
      {
        user: students[0]._id,
        subject: "Company eligibility",
        message: "The eligibility dashboard is useful. Company-specific preparation sheets would make it even better.",
        rating: 5,
        status: "new"
      },
      {
        user: students[1]._id,
        subject: "Aptitude practice",
        message: "Please add more timed aptitude sets for probability, percentages, and logical reasoning.",
        rating: 4,
        status: "reviewed",
        adminResponse: "More aptitude sets will be added in the next upload."
      },
      {
        user: students[2]._id,
        subject: "Mock interviews",
        message: "Mock interview reminders helped me stay consistent and improve my communication.",
        rating: 5,
        status: "resolved",
        adminResponse: "Glad it helped. More mentor slots are being scheduled."
      }
    ]);

    console.log("Seed completed successfully");
    console.log("Admin login: admin@placementportal.com / admin123");
    console.log("Student login: ananya@student.com / student123");
    console.log(`Seeded by admin account: ${admin.email}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
