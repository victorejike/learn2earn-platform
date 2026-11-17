import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # ─── Enums ────────────────────────────────────────────────
  enum UserRole {
    APPLICANT
    PISCINER
    STUDENT
    CAMPUS_STAFF
    HEAD_OF_CAMPUS
    ADMIN
    SUPER_ADMIN
  }

  enum UserStatus {
    PENDING_VERIFICATION
    ADMISSION_TEST
    PISCINE
    ACTIVE
    AT_RISK
    INACTIVE
    GRADUATED
    REJECTED
  }

  enum ProjectStatus {
    LOCKED
    AVAILABLE
    IN_PROGRESS
    SUBMITTED
    IN_REVIEW
    PASSED
    FAILED
  }

  enum AdmissionApplicationStatus {
    SUBMITTED
    UNDER_REVIEW
    INVITED
    ASSESSMENT_IN_PROGRESS
    ASSESSMENT_SUBMITTED
    ACCEPTED
    REJECTED
  }

  enum AdmissionTestStatus {
    INVITED
    IN_PROGRESS
    SUBMITTED
    EXPIRED
  }

  enum AdmissionQuestionType {
    SINGLE_CHOICE
    MULTIPLE_CHOICE
    BOOLEAN
  }

  enum AdmissionReviewDecision {
    INVITE
    REJECT
  }

  # ─── Types ────────────────────────────────────────────────

  type Organization {
    id: ID!
    slug: String!
    name: String!
    description: String
    logoUrl: String
    website: String
    country: String
    city: String
    plan: String!
    status: String!
    customDomain: String
    maxStudents: Int!
    studentCount: Int!
    campuses: [Campus!]!
    createdAt: DateTime!
  }

  type Campus {
    id: ID!
    slug: String!
    name: String!
    description: String
    city: String
    country: String
    timezone: String!
    isVirtual: Boolean!
    status: String!
    maxStudents: Int
    studentCount: Int!
    activeCount: Int!
    atRiskCount: Int!
    createdAt: DateTime!
  }

  type User {
    id: ID!
    username: String!
    email: String!
    fullName: String!
    role: UserRole!
    status: UserStatus!
    xpTotal: Int!
    level: Int!
    auditRatio: Float!
    correctionPoints: Int!
    avatarUrl: String
    lastActiveAt: DateTime
    createdAt: DateTime!
    organization: Organization
    campus: Campus
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Project {
    id: ID!
    slug: String!
    title: String!
    description: String!
    xpReward: Int!
    isGroupProject: Boolean!
    tags: [String!]!
    createdAt: DateTime!
  }

  type StudentProject {
    id: ID!
    user: User!
    project: Project!
    status: ProjectStatus!
    gitRepoUrl: String
    finalGrade: Float
    xpEarned: Int!
    attemptCount: Int!
    startedAt: DateTime
    passedAt: DateTime
  }

  type Cohort {
    id: ID!
    name: String!
    description: String
    cohortType: String!
    status: String!
    startsAt: DateTime!
    endsAt: DateTime!
    maxCapacity: Int
    memberCount: Int!
  }

  type DashboardStats {
    totalStudents: Int!
    activeStudents: Int!
    atRiskStudents: Int!
    graduatedStudents: Int!
    activeCohorts: Int!
  }

  type AdmissionApplication {
    id: ID!
    reference: String!
    user: User!
    campus: Campus
    status: AdmissionApplicationStatus!
    dateOfBirth: String!
    country: String!
    city: String!
    highestEducation: String!
    codingExperience: String!
    motivation: String!
    availability: String!
    referralSource: String
    reviewNotes: String
    reviewedAt: DateTime
    submittedAt: DateTime!
    createdAt: DateTime!
  }

  type AdmissionQuestionOption {
    value: String!
    label: String!
  }

  type AdmissionQuestion {
    id: ID!
    prompt: String!
    type: AdmissionQuestionType!
    options: [AdmissionQuestionOption!]!
    points: Float!
    position: Int!
  }

  type AdmissionTest {
    id: ID!
    status: AdmissionTestStatus!
    durationMinutes: Int!
    passScore: Float!
    startedAt: DateTime
    expiresAt: DateTime
    invitationExpiresAt: DateTime!
    submittedAt: DateTime
    score: Float
    maxScore: Float!
    passed: Boolean
    feedback: String
    questions: [AdmissionQuestion!]!
  }

  type AdmissionApplicationPayload {
    token: String!
    user: User!
    application: AdmissionApplication!
  }

  # ─── Queries ──────────────────────────────────────────────
  type Query {
    # Auth
    me: User

    # Public admissions
    applicationCampuses(orgSlug: String = "1talent"): [Campus!]!

    # Applicant admissions
    myAdmissionApplication: AdmissionApplication
    myAdmissionTest: AdmissionTest

    # Staff admissions
    admissionApplications(
      status: AdmissionApplicationStatus
      campusId: ID
      limit: Int
      offset: Int
    ): [AdmissionApplication!]!

    # Students
    users(role: UserRole, status: UserStatus, limit: Int, offset: Int): [User!]!
    user(id: ID!): User

    # Projects
    projects(limit: Int, offset: Int): [Project!]!
    project(slug: String!): Project
    myProjects: [StudentProject!]!

    # Campuses
    campuses(orgSlug: String): [Campus!]!
    campus(id: ID!): Campus

    # Cohorts
    cohorts(status: String): [Cohort!]!
    cohort(id: ID!): Cohort

    # Dashboard
    dashboardStats: DashboardStats!

    # Multi-tenancy (super_admin only)
    organizations(limit: Int, offset: Int): [Organization!]!
    organization(slug: String!): Organization
  }

  # ─── Mutations ────────────────────────────────────────────
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    completeRegistration(input: CompleteRegistrationInput!): AuthPayload!
    login(email: String!, password: String!, orgSlug: String): AuthPayload!

    # Admissions
    submitAdmissionApplication(input: SubmitAdmissionApplicationInput!): AdmissionApplicationPayload!
    reviewAdmissionApplication(
      applicationId: ID!
      decision: AdmissionReviewDecision!
      notes: String
    ): AdmissionApplication!
    startAdmissionTest: AdmissionTest!
    submitAdmissionTest(answers: [AdmissionAnswerInput!]!): AdmissionTest!

    # Admin
    updateUserRole(userId: ID!, role: UserRole!): User!
    updateUserStatus(userId: ID!, status: UserStatus!): User!

    # Cohorts
    createCohort(input: CreateCohortInput!): Cohort!

    # Campus management
    createCampus(input: CreateCampusInput!): Campus!
    updateCampusStatus(campusId: ID!, status: String!): Campus!
    assignUserToCampus(userId: ID!, campusId: ID!): User!

    # Multi-tenancy (super_admin only)
    createOrganization(input: CreateOrganizationInput!): Organization!
    updateOrganizationPlan(orgId: ID!, plan: String!): Organization!
    suspendOrganization(orgId: ID!): Organization!
  }

  # ─── Inputs ───────────────────────────────────────────────
  input RegisterInput {
    email: String!
    username: String
    password: String
    fullName: String
    phone: String
    orgId: ID
    campusId: ID
  }

  input CompleteRegistrationInput {
    emailToken: String
    email: String
    firstName: String!
    lastName: String!
    password: String!
  }

  input SubmitAdmissionApplicationInput {
    username: String!
    email: String!
    password: String!
    fullName: String!
    phone: String
    orgSlug: String = "1talent"
    campusId: ID!
    dateOfBirth: String!
    country: String!
    city: String!
    highestEducation: String!
    codingExperience: String!
    motivation: String!
    availability: String!
    referralSource: String
    termsAccepted: Boolean!
    dataConsent: Boolean!
  }

  input AdmissionAnswerInput {
    questionId: ID!
    selectedOptions: [String!]!
  }

  input CreateOrganizationInput {
    slug: String!
    name: String!
    description: String
    country: String
    city: String
    plan: String!
    maxStudents: Int
    customDomain: String
  }

  input CreateCampusInput {
    orgId: ID
    slug: String!
    name: String!
    description: String
    city: String
    country: String
    timezone: String
    isVirtual: Boolean
    maxStudents: Int
  }

  input CreateCohortInput {
    name: String!
    description: String
    cohortType: String!
    startsAt: DateTime!
    endsAt: DateTime!
    maxCapacity: Int
  }
`;
