import React from "react";
import camPhoto from "../images/cam.jpeg";
import egiPhoto from "../images/egi.jpeg";
import aidanPhoto from "../images/aidan.jpeg";

type Creator = {
  name: string;
  linkedin: string;
  photo?: string;
  funFact: string;
};

const AboutPage: React.FC = () => {
  const creators: Creator[] = [
    {
      name: "Egi Rama",
      linkedin: "https://www.linkedin.com/in/egi-rama-094a531b9/",
      photo: egiPhoto,
      funFact: "She was born in Tirana, Albania!",
    },
    {
      name: "Cameron Kerestus",
      linkedin: "https://www.linkedin.com/in/cameron-kerestus/",
      photo: camPhoto,
      funFact: "Has studied abroad at Temple University Japan twice!",
    },
    {
      name: "Aidan Yokanovich",
      linkedin: "https://www.linkedin.com/in/aidanyokanovich/",
      photo: aidanPhoto,
      funFact: "His father is a pilot!",
    },
  ];

  return (
    <div className="bg-gray-900 text-gray-200">
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <h1 className="text-4xl lg:text-5xl  text-amber-600 font-bold">
            About Wanderly
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Wanderly, saves the trouble of wasting time on an itinerary by
            creating a unique and tailored route for the user based on their
            specific location. Additionally, users have the ability to blacklist
            any sort of activity or location to prevent it from showing up in a
            given itinerary.
          </p>
          <p className="text-lg text-gray-300 leading-relaxed">
            The user will be given a full itinerary for the day in the area they
            chose that would sync up with a Google map window on the page,
            providing a visual route. The user would be able to tweak
            itineraries, add their favorite routes to a folder, and access links
            to resources for their specific itinerary.
          </p>
        </div>
      </section>

      <section className="bg-gray-950 border-t border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold text-amber-600">
              Our Motivation
            </h2>
            <p className="text-gray-300 leading-relaxed">
              As study abroad students, we often struggle with juggling time for
              coursework versus finding time for planning trips. Living in a new
              country can be intimidating, but planning trips should not.
              Wanderly is our way of helping students and travelers like us
              spend less time searching and more time discovering places that
              resonate.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Every feature is grounded in the moments we wished existed on our
              own trips: quicker answers, smarter suggestions, and a platform to
              save your trips.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-4">
            <h3 className="text-xl font-semibold text-white">
              What Wanderly Helps You Do
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li>• Turn interests into ready-to-go itineraries in seconds</li>
              <li>• Surface hidden gems alongside must-see highlights</li>
              <li>
                • Track sources so you can verify and book with confidence
              </li>
              <li>• Keep plans flexible and visualizes locations on maps</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="space-y-6 text-center">
          <h2 className="text-3xl font-semibold text-white">Meet the Crew</h2>
        </div>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((member) => (
            <div
              key={member.name}
              className="bg-gray-950 border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4"
            >
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={`${member.name} headshot`}
                  className="h-36 w-36 rounded-full border border-gray-700 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-36 w-36 rounded-full border border-gray-700 bg-gray-800 flex items-center justify-center text-sm text-gray-500">
                  Photo
                </div>
              )}
              <div className="space-y-1">
                <p className="text-lg font-semibold text-white">
                  {member.name}
                </p>
                <a
                  href={member.linkedin}
                  className="text-sm text-amber-600 hover:text-amber-300 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn Profile
                </a>
              </div>
              <p className="text-sm text-gray-400">{member.funFact}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
