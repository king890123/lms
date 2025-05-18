import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { useParams } from 'react-router-dom';
import { assets } from '../../assets/assets';
import humanizeDuration from 'humanize-duration';
import YouTube from 'react-youtube';
import Footer from '../../components/student/Footer';
import Rating from '../../components/student/Rating';
import Loading from '../../components/student/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';

const Player = () => {
  const { enrolledCourses, calculateChapterTime, backendUrl, getToken, userData, fetchUserEnrolledCourses } = useContext(AppContext);
  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState({ lectureCompleted: [] });
  const [initialRating, setInitialRating] = useState(0);

  const getCourseData = () => {
    enrolledCourses?.forEach(course => {
      if (course._id === courseId) {
        setCourseData(course);
        course.courseRatings?.forEach((item) => {
          if (item.userId === userData?._id) {
            setInitialRating(item.rating);
          }
        });
      }
    });
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (enrolledCourses?.length > 0) {
      getCourseData();
    }
  }, [enrolledCourses]);

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + '/api/user/update-course-progress',
        { lectureId, courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        getCourseProgress();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        backendUrl + '/api/user/get-course-progress',
        {
          params: { courseId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (data.success) {
        setProgressData(data.progressData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleRate = async (rating) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + '/api/user/add-rating',
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        fetchUserEnrolledCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (courseId) {
      getCourseProgress();
    }
  }, [courseId]);

  return courseData ? (
    <>
      <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36'>
        {/* left side */}
        <div className='text-gray-800'>
          <h2 className='text-xl font-semibold'>Course Structure</h2>
          <div className='pt-5'>
            {courseData.courseContent.map((chapter, index) => (
              <div key={index} className='border border-gray-300 bg-white mb-2 rounded'>
                <div onClick={() => toggleSection(index)} className='flex justify-between items-center px-4 py-3 cursor-pointer select-none'>
                  <div className='flex items-center gap-2'>
                    <img className={`transform transition-transform ${openSections[index] ? 'rotate-180' : ''}`} src={assets.down_arrow_icon} alt="toggle section" />
                    <p className='font-medium md:text-base text-sm'>{chapter.chapterTitle}</p>
                  </div>
                  <p className='text-sm md:text-default'>{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? 'max-h-96' : 'max-h-0'}`}>
                  <ul className='list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300'>
                    {chapter.chapterContent.map((lecture, idx) => (
                      <li className='flex items-start gap-2 py-1' key={idx}>
                        <img src={progressData?.lectureCompleted?.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon} alt="status icon" className='w-4 h-4 mt-1'/>
                        <div className='flex justify-between items-center w-full text-gray-800 text-xs md:text-default'>
                          <p>{lecture.lectureTitle}</p>
                          <div className='flex gap-2'>
                            {lecture.lectureUrl && <p onClick={() => setPlayerData({
                              ...lecture, chapter: index + 1, lecture: idx + 1
                            })} className='text-blue-500 cursor-pointer'>Watch</p>}
                            <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className='flex items-center gap-2 py-3 mt-10'>
            <h1 className='text-xl font-bold'>Rate this Course</h1>
            <Rating initialRating={initialRating} onRate={handleRate}/>
          </div>
        </div>

        {/* right side */}
        <div className='md:mt-10'>
          {playerData ? (
            <div>
              <YouTube videoId={playerData.lectureUrl.split('v=')[1]?.split('&')[0]} iframeClassName='w-full aspect-video'/>
              <div className='flex justify-between items-center mt-1'>
                <p>Chapter {playerData.chapter} • Lecture {playerData.lecture} • {playerData.lectureTitle}</p>
                <button onClick={() => markLectureAsCompleted(playerData.lectureId)} className='text-blue-600'>
                  {progressData?.lectureCompleted?.includes(playerData.lectureId) ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ) : (
            <img src={courseData.courseThumbnail} alt="Course thumbnail" className='w-full'/>
          )}
        </div>
      </div>
      <Footer/>
    </>
  ) : <Loading message="Loading course data..." />;
}

export default Player;