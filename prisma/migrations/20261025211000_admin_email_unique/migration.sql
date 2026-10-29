CREATE UNIQUE INDEX "OrderEmailLog_admin_new_order_unique"
ON "OrderEmailLog" ("orderId")
WHERE "type" = 'ADMIN_NEW_ORDER'::"OrderEmailType";
