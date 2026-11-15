import Types "common";
// Social sharing domain types
module {
  public type SharePlatform = {
    #twitter;
    #facebook;
    #whatsapp;
    #instagram;
    #other : Text;
  };

  public type ShareEvent = {
    id : Nat;
    userId : Types.UserId;
    orderId : ?Types.OrderId;
    platform : SharePlatform;
    createdAt : Types.Timestamp;
  };
};
