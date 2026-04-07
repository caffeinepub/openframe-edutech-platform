import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Migration "migration";

(with migration = Migration.run)
actor {
  type CourseId = Nat;
  type LessonId = Nat;
  type StudentId = Nat;

  // Course types
  public type Course = {
    id : CourseId;
    name : Text;
    courseType : CourseType;
    price : Nat;
    lessons : [Text];
    passingScore : Nat;
  };

  module Course {
    public func compare(course1 : Course, course2 : Course) : Order.Order {
      Nat.compare(course1.id, course2.id);
    };
  };

  public type CourseType = {
    #basic;
    #standard;
    #premium;
  };

  // Student public profile
  public type Student = {
    id : StudentId;
    name : Text;
    referredBy : Nat;
  };

  module Student {
    public func compare(student1 : Student, student2 : Student) : Order.Order {
      Nat.compare(student1.id, student2.id);
    };
  };

  // Enrollment and payment status
  public type Registration = {
    studentId : StudentId;
    courseId : CourseId;
    paid : Bool;
    batch : ?Text;
  };

  module Registration {
    public func compare(registration1 : Registration, registration2 : Registration) : Order.Order {
      Nat.compare(registration1.studentId, registration2.studentId);
    };
  };

  // Quiz and exam
  public type Question = {
    text : Text;
    options : [Text];
    correctIndex : Nat;
  };

  public type ExamResult = {
    studentId : StudentId;
    score : Nat;
  };

  public type Certificate = {
    studentId : StudentId;
    courseId : CourseId;
    certificateNumber : Text;
  };

  // Notification
  public type Notification = {
    recipient : Principal;
    message : Text;
  };

  module Notification {
    public func compare(notification1 : Notification, notification2 : Notification) : Order.Order {
      Principal.compare(notification1.recipient, notification2.recipient);
    };
  };

  // Field executive
  public type FieldExecutive = {
    id : Nat;
    name : Text;
    referredStudents : [Student];
    bonus : Nat;
  };

  module FieldExecutive {
    public func compare(fieldExecutive1 : FieldExecutive, fieldExecutive2 : FieldExecutive) : Order.Order {
      Nat.compare(fieldExecutive1.id, fieldExecutive2.id);
    };
  };

  // Wallet integration
  public type Payment = {
    studentId : StudentId;
    amount : Nat;
    paymentStatus : PaymentStatus;
    txHash : ?Text;
  };

  module Payment {
    public func compare(payment1 : Payment, payment2 : Payment) : Order.Order {
      Nat.compare(payment1.studentId, payment2.studentId);
    };
  };

  public type PaymentStatus = {
    #pending;
    #completed;
    #failed;
  };

  // Admin dashboard statistics
  public type DashboardStats = {
    totalStudents : Nat;
    totalRevenue : Nat;
    totalRegistrations : Nat;
  };

  // Persistent storage
  let courses = Map.empty<CourseId, Course>();
  let students = Map.empty<StudentId, Student>();
  let _fieldExecutives = Map.empty<Nat, FieldExecutive>();
  let _notifications = Map.empty<Principal, [Notification]>();
  let registrations = Map.empty<StudentId, [Registration]>();
  let payments = Map.empty<StudentId, [Payment]>();
  var adminPrincipal : ?Principal = null;

  // Course management
  public shared ({ caller }) func createCourse(name : Text, courseType : CourseType, price : Nat, lessons : [Text], passingScore : Nat) : async () {
    requireAdmin(caller);
    let id = courses.size() + 1;
    let course : Course = {
      id;
      name;
      courseType;
      price;
      lessons;
      passingScore;
    };
    courses.add(id, course);
  };

  public query func getCourse(id : CourseId) : async ?Course {
    courses.get(id);
  };

  public query func getAllCourses() : async [Course] {
    courses.values().toArray().sort();
  };

  // Student registration
  public shared ({ caller = _ }) func registerStudent(name : Text, referredBy : Nat) : async StudentId {
    let id = students.size() + 1;
    let student : Student = {
      id;
      name;
      referredBy;
    };
    students.add(id, student);
    id;
  };

  public shared ({ caller = _ }) func registerStudentForCourse(studentId : StudentId, courseId : CourseId) : async () {
    let registration : Registration = {
      studentId;
      courseId;
      paid = false;
      batch = null;
    };

    let existing = switch (registrations.get(studentId)) {
      case (null) { [] };
      case (?regs) { regs };
    };
    let newRegs = existing.concat([registration]);
    registrations.add(studentId, newRegs);
  };

  public shared ({ caller = _ }) func processPayment(studentId : StudentId, amount : Nat) : async () {
    let payment : Payment = {
      studentId;
      amount;
      paymentStatus = #pending;
      txHash = null;
    };

    let existing = switch (payments.get(studentId)) {
      case (null) { [] };
      case (?pays) { pays };
    };
    payments.add(studentId, existing.concat([payment]));
  };

  public query func getStudent(id : StudentId) : async ?Student {
    students.get(id);
  };

  public query func getAllStudents() : async [Student] {
    students.values().toArray().sort();
  };

  // Field executive management (omitting for brevity)
  // Notification management (omitting for brevity)
  // Batch management
  public shared ({ caller }) func assignBatch(studentId : StudentId, batch : Text) : async () {
    requireAdmin(caller);
    switch (registrations.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?regs) {
        let updated = regs.map(func(r) { { r with batch = ?batch } });
        registrations.add(studentId, updated);
      };
    };
  };

  // Exam and certificate management (omitting for brevity)
  // Admin dashboard
  public query ({ caller }) func getDashboard() : async DashboardStats {
    requireAdmin(caller);
    var revenue = 0;
    payments.toArray().forEach(
      func((_, pays)) {
        pays.forEach(
          func(p) {
            switch (p.paymentStatus) {
              case (#completed) { revenue += p.amount };
              case (_) {};
            };
          }
        );
      }
    );
    {
      totalStudents = students.size();
      totalRevenue = revenue;
      totalRegistrations = registrations.size();
    };
  };

  // Helper function for admin check
  func requireAdmin(caller : Principal) {
    switch (adminPrincipal) {
      case (null) { Runtime.trap("Admin not set") };
      case (?admin) {
        if (caller != admin) {
          Runtime.trap("Only admin can perform this action");
        };
      };
    };
  };

  public shared ({ caller }) func setAdmin() : async () {
    if (adminPrincipal != null) {
      Runtime.trap("Admin already set");
    };
    adminPrincipal := ?caller;
  };
};
