import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Old types matching the previous stable variable shapes
  type Student = {
    id : Nat;
    name : Text;
    referredBy : Nat;
  };

  type FieldExecutive = {
    id : Nat;
    name : Text;
    referredStudents : [Student];
    bonus : Nat;
  };

  type Notification = {
    recipient : Principal;
    message : Text;
  };

  type OldActor = {
    fieldExecutives : Map.Map<Nat, FieldExecutive>;
    notifications : Map.Map<Principal, [Notification]>;
  };

  type NewActor = {};

  // Consume and discard fieldExecutives and notifications from old state.
  public func run(_old : OldActor) : NewActor {
    {};
  };
};
