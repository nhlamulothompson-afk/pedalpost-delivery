import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

// Public API mixin for email notification configuration.
// Allows the operator to set/get the operator email address for order reports.
mixin (
  accessControlState : AccessControl.AccessControlState,
  operatorEmail : { var value : Text },
) {

  // Admin: set the operator email address that receives order status reports
  public shared ({ caller }) func setOperatorEmail(email : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    operatorEmail.value := email;
  };

  // Admin: get the current operator email address
  public query ({ caller }) func getOperatorEmail() : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    operatorEmail.value;
  };
};
