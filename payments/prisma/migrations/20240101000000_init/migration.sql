-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "stripeRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'succeeded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);
