import React from "react";
import Button from "./Button";

const DeleteAlertContent = ({content, onDelete}) => {
    return (
        <div className="p-5">
            <p className="text-sm font-medium text-gray-800 mb-6">{content}</p>
            <div className="flex justify-end gap-3">
                <Button
                type="button"
                variant="secondary"
                onClick={onDelete}>
                    Delete
                </Button>
            </div>
        </div>
    )
}
export default DeleteAlertContent;
