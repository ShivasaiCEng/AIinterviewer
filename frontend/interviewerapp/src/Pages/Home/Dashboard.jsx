import React, { useEffect, useState } from "react";
import { LuMoveDiagonal, LuPlus } from "react-icons/lu";
import { CARD_BG } from "../../utils/data";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import SummaryCard from "../../components/Cards/SummaryCard";
import moment from "moment";
import Modal from "../../components/Modal";
import CreateSessionForm from "./CreateSessionForm";
import DeleteAlertContent from "../../components/DeleteAlertContent";
import Button from "../../components/Button";
import SessionModeChoice from "../../components/SessionModeChoice";

const Dashboard = () => {
  const navigate = useNavigate();
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [showModeChoice, setShowModeChoice] = useState(false);
  const [sessionMode, setSessionMode] = useState(null); // 'manual' or 'automatic'
  const [sessions, setSessions] = useState([]);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    open: false,
    data: null,
  });
  const fetchAllSessions = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.SESSION.GET_ALL);
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching session data:",error);
    }
  };
  const deleteSession = async (sessionData) => {
     try {
       await axiosInstance.delete(API_PATHS.SESSION.DELETE(sessionData?._id));
       toast.success("Session Deleted Successfully");
       setOpenDeleteAlert({
         open: false,
         data: null,
       });
       fetchAllSessions();
     } catch (error) {
       console.error("Error deleting session data:" , error);
       
     }
  };
  useEffect(() => {
    fetchAllSessions();
  }, []);
  return ( 
    <DashboardLayout>
      <div className="container mx-auto pt-4 pb-4" style={{ backgroundColor: '#fffdf5', minHeight: '100vh' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-7 pt-1 pb-6 px-4 md:px-0">
       {sessions?.map((data, index) => (
        <SummaryCard
        key={data?._id}
        colors={CARD_BG[index % CARD_BG.length]}
        role={data?.role ||""}
        topicsToFocus={data?.topicsToFocus ||""}
        experience={data?.experience ||"-"}
        questions={data?.questions?.length || "-"}
        description={data?.description || ""}
        lastUpdated={
          data?.updatedAt
          ? moment(data.updatedAt).format("Do MMM YYYY")
          : ""
        }
        onSelect={() => navigate(`/interviewapp/${data?._id}`)}
        onDelete={() => setOpenDeleteAlert({open : true, data})}
        />
        ))}
        </div> 
        <button
        className="h-12 md:h-12 flex items-center justify-center gap-3 text-sm font-bold text-white px-7 py-2.5 fixed bottom-10 md:bottom-20 right-10 md:right-20 border-3 border-black shadow-neo hover:-translate-y-1 hover:shadow-neo-hover transition-all"
        onClick={() => setShowModeChoice(true)}
        style={{ backgroundColor: '#8b5cf6' }}
        >
          <LuPlus className="text-2xl text-white" />
          Add New
        </button>
      </div>

      {/* Mode Choice Modal */}
      <Modal 
      isOpen={showModeChoice}
      onClose={() => {
        setShowModeChoice(false);
        setSessionMode(null);
      }}
      hideHeader
      >
        <SessionModeChoice
          onSelectManual={() => {
            console.log("Manual mode selected");
            setSessionMode('manual');
            setShowModeChoice(false);
            setTimeout(() => {
              setOpenCreateModal(true);
            }, 100);
          }}
          onSelectAutomatic={() => {
            console.log("Automatic mode selected");
            setSessionMode('automatic');
            setShowModeChoice(false);
            setTimeout(() => {
              setOpenCreateModal(true);
            }, 100);
          }}
        />
      </Modal>

     <Modal 
      isOpen={openCreateModal}
      onClose={() => {
        setOpenCreateModal(false);
        setSessionMode(null);
      }}
      hideHeader
      >
        <div>
          <CreateSessionForm mode={sessionMode || 'manual'} />
        </div>
      </Modal>
       <Modal
       isOpen={openDeleteAlert?.open}
       onClose={() => {
         setOpenDeleteAlert({open: false, data: null });
       }}
       title="Delete alert" >
         <div className="w-[30vw]">
           <DeleteAlertContent
           content="Are you sure you want to delete this session detail?"
           onDelete={() => deleteSession(openDeleteAlert.data)}
           />
         </div>
       </Modal> 
    </DashboardLayout>
  )
};

export default Dashboard;
