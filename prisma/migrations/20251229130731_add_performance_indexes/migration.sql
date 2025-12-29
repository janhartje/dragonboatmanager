-- CreateIndex
CREATE INDEX "Assignment_eventId_idx" ON "Assignment"("eventId");

-- CreateIndex
CREATE INDEX "Attendance_eventId_idx" ON "Attendance"("eventId");

-- CreateIndex
CREATE INDEX "Attendance_paddlerId_idx" ON "Attendance"("paddlerId");

-- CreateIndex
CREATE INDEX "Event_teamId_idx" ON "Event"("teamId");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "Paddler_userId_idx" ON "Paddler"("userId");

-- CreateIndex
CREATE INDEX "Paddler_teamId_idx" ON "Paddler"("teamId");
