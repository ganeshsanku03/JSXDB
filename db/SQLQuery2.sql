CREATE DATABASE BloodScriptDB

SELECT name FROM master.sys.databases ORDER BY name;

CREATE TABLE blood_availability (
  id INT IDENTITY PRIMARY KEY,
  hospital VARCHAR(255),
  county VARCHAR(100),
  bloodType VARCHAR(10),
  component VARCHAR(50),
  units INT
);


INSERT INTO blood_availability (hospital, county, bloodType, component, units)
VALUES 
('St. Vincent''s Hospital', 'Dublin', 'A+', 'Whole Blood', 5),
('Mater Hospital', 'Dublin', 'O+', 'Red Blood Cells', 3),
('Cork University Hospital', 'Cork', 'B+', 'Plasma', 7),
('Galway Clinic', 'Galway', 'AB+', 'Platelets', 2);

CREATE TABLE BloodRequests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(255),
    mobile NVARCHAR(20),
    email NVARCHAR(255),
    blood_group NVARCHAR(10),
    component NVARCHAR(50),
    county NVARCHAR(100),
    hospital NVARCHAR(255),
    required_date DATE,
    units INT,
    reason NVARCHAR(MAX),
    submitted_at DATETIME DEFAULT GETDATE()
);

ALTER TABLE BloodRequests ADD status NVARCHAR(20) DEFAULT 'Pending';

UPDATE BloodRequests SET status = 'Pending' WHERE status IS NULL;


INSERT INTO BloodRequests (
    full_name, mobile, email, blood_group, component, county, hospital, required_date, units, reason
)
VALUES
('Alice Johnson', '0851234567', 'alice.johnson@example.com', 'A+', 'Plasma', 'Dublin', 'St. Vincent’s Hospital', '2025-04-25', 2, 'Emergency surgery'),
('Michael Collins', '0876543210', 'michael.collins@example.com', 'O-', 'Red Blood Cells', 'Cork', 'Cork University Hospital', '2025-04-27', 3, 'Accident victim'),
('Sarah O’Neill', '0867891234', 'sarah.oneill@example.com', 'B+', 'Platelets', 'Galway', 'Galway Clinic', '2025-04-30', 1, 'Cancer treatment support');




CREATE TABLE blood_donation_camps (
    id INT IDENTITY(1,1) PRIMARY KEY,
    camp_name NVARCHAR(100),
    organizer NVARCHAR(100),
    location NVARCHAR(150),
    county NVARCHAR(50),
    date DATE,
    time NVARCHAR(20),
    contact NVARCHAR(50)
);

INSERT INTO blood_donation_camps (camp_name, organizer, location, county, date, time, contact)
VALUES
('City Center Blood Drive', 'Red Cross', 'City Hall, Dublin', 'Dublin', '2025-04-20', '10:00 AM - 3:00 PM', '1234567890'),
('College Camp', 'NSS Volunteers', 'UCD Campus, Dublin', 'Dublin', '2025-04-15', '9:00 AM - 1:00 PM', '0987654321');

DROP TABLE blood_donation_camps;



CREATE TABLE VoluntaryCamps (
    id INT IDENTITY PRIMARY KEY,
    org_type VARCHAR(100),
    org_name VARCHAR(255),
    organizer_name VARCHAR(255),
    organizer_mobile VARCHAR(15),
    organizer_email VARCHAR(255),
    co_organizer_name VARCHAR(255),
    co_organizer_mobile VARCHAR(15),
    camp_name VARCHAR(255),
    camp_address TEXT,
    state VARCHAR(100),
    district VARCHAR(100),
    city_name VARCHAR(100),
    blood_bank VARCHAR(255),
    camp_date DATE,
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    latitude VARCHAR(50),
    longitude VARCHAR(50),
    estimated_participants INT,
    reference VARCHAR(255),
    remarks TEXT
);

ALTER TABLE VoluntaryCamps DROP COLUMN 
    state,
    district,
    city_name,
    latitude,
    longitude,
    reference,
    remarks;

	ALTER TABLE VoluntaryCamps ADD
    county VARCHAR(100),
    eircode VARCHAR(10),
    contact_role VARCHAR(100),
    preferred_slot VARCHAR(50),
    refreshments VARCHAR(10),
    accessibility VARCHAR(10),
    expected_units INT;

	EXEC sp_help VoluntaryCamps;

INSERT INTO VoluntaryCamps (
    org_type, org_name, organizer_name, organizer_mobile, organizer_email,
    co_organizer_name, co_organizer_mobile, camp_name, camp_address,
    blood_bank, camp_date, start_time, end_time, estimated_participants,
    county, eircode, contact_role, preferred_slot, refreshments, accessibility, expected_units
)
VALUES 
-- Dublin Camp
('Hospital', 'St. Vincent''s Hospital', 'Dr. John Kelly', '0871234567', 'john.kelly@svh.ie',
 '', '', 'City Centre Blood Drive', '123 Grafton Street, Dublin',
 'Irish Blood Transfusion Service', '2025-04-18', '10:00', '14:00', 100,
 'Dublin', 'D02X285', 'Medical Lead', 'Morning', 'Yes', 'Yes', 80),

-- Cork Camp
('Corporate', 'Dell Technologies', 'Sarah Nolan', '0869876543', 'sarah.nolan@dell.ie',
 'Mark Lee', '0861237890', 'Tech Park Blood Camp', 'Unit 5, Business Park, Cork',
 'Red Cross Blood Bank', '2025-04-22', '09:30', '13:30', 85,
 'Cork', 'T12H1ZZ', 'Event Coordinator', 'Midday', 'Yes', 'No', 60),

-- Galway Camp
('NGO', 'Helping Hands', 'Tom O''Brien', '0857779999', 'tom@helpinghands.ie',
 '', '', 'Galway West Community Camp', 'Community Hall, Westside, Galway',
 'HSE Blood Donation Centre', '2025-04-25', '11:00', '15:00', 60,
 'Galway', 'H91T234', 'Organizer', 'Afternoon', 'No', 'Yes', 45);





CREATE TABLE Donors (
    id INT IDENTITY PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    mobile VARCHAR(15),
    email VARCHAR(255),
    address TEXT,
    county VARCHAR(100),
    eircode VARCHAR(20),
    age INT,
    blood_group VARCHAR(5),
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255)
);

ALTER TABLE Donors
ADD
    total_donations INT DEFAULT 0,
    total_issues INT DEFAULT 0,
    last_login DATETIME NULL;

ALTER TABLE Donors ADD gender NVARCHAR(10), dob DATE;

ALTER TABLE Donors
DROP COLUMN total_issues;


SELECT id, email, password_hash FROM Donors WHERE LOWER(email) = 'ganesh123@gmail.com';

UPDATE Donors
SET password_hash = @password_hash
WHERE LOWER(email) = @email;

select * from Donors;


DECLARE @constraint NVARCHAR(128);
SELECT @constraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c
  ON c.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.Donors')
  AND c.name = 'total_issues';

IF @constraint IS NOT NULL
BEGIN
    EXEC ('ALTER TABLE dbo.Donors DROP CONSTRAINT [' + @constraint + ']');
END



CREATE TABLE DonationCertificates (
  id INT IDENTITY PRIMARY KEY,
  donor_id INT,
  date DATE,
  location NVARCHAR(150),
  status NVARCHAR(50),
  FOREIGN KEY (donor_id) REFERENCES Donors(id)
);

ALTER TABLE DonationCertificates
ADD component NVARCHAR(50);

select * from DonationCertificates;

CREATE TABLE AdminUsers (
  id INT IDENTITY PRIMARY KEY,
  username NVARCHAR(50) UNIQUE NOT NULL,
  password_hash NVARCHAR(255) NOT NULL
);

INSERT INTO AdminUsers (username, password_hash)
VALUES ('admin', '$2b$10$V7Hcq6grSnL9ThbE6LAih.zSj/usJgki8wKJGUPu9x0pe8eILqjYK');

--------------------------------------------------------------------------

DECLARE @DonorId          INT            = 1;            -- <‑‑ CHANGE ME
DECLARE @DonationDate     DATE           = '2025‑04‑15'; -- <‑‑ CHANGE ME
DECLARE @Location         NVARCHAR(200)  = 'Cork Donor Centre';
DECLARE @Status           NVARCHAR(50)   = 'Successful';
DECLARE @Component        NVARCHAR(50)   = 'Whole Blood';

BEGIN TRAN;

    /* 1.  Insert certificate  */
    INSERT INTO DonationCertificates
        ( donor_id,
          date,
          location,
          status,
          component
        )
    VALUES
        ( @DonorId,
          @DonationDate,
          @Location,
          @Status,
          @Component
        );

    /* 2.  Update donor’s total_donations  */
    UPDATE Donors
    SET    total_donations = ISNULL(total_donations,0) + 1
    WHERE  id = @DonorId;

COMMIT;

SELECT donor_id,
       date,
       component
FROM   DonationCertificates
WHERE  donor_id = 1
ORDER  BY date DESC;




